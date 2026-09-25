# Plan 003: Corrección de Persistencia de Sesión, Caché en Memoria y Contexto de Empresa en Login

## Metadatos
- **ID:** 003-fix-session-and-company-cache-on-login
- **Fecha:** 2026-09-25
- **Estado:** En Revisión / Listo para Ejecución
- **Tareas Asociadas:** [tasks/003-fix-session-and-company-cache-on-login.md](../tasks/003-fix-session-and-company-cache-on-login.md)

---

## 1. Requerimiento Original
> "revisa si hay algun problema con el cache o que es lo que esta pasando, el problema es:
> si me logueo como superadmin se queda con los permisos y la empresa que estube previamente logueado"

El usuario reporta que al autenticarse como `SuperAdmin` (o al alternar entre usuarios en la misma sesión del navegador), la aplicación mantiene la empresa activa y los permisos/features asignados al usuario previamente autenticado, en lugar de reiniciar el contexto y permitir la selección de la empresa o aplicar los permisos de SuperAdmin correspondientes.

---

## 2. Hallazgos en el Codebase (Findings)

### Finding 1: Retención de Estado en Memoria en `CompanyContextService` durante el Logout
- En `frontend/src/app/core/services/auth.service.ts` (`logout()`):
  ```typescript
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('medapp_active_company');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
  ```
  - `localStorage` se limpia, pero **`CompanyContextService` no se inyecta ni se llama a `clearActiveCompany()`**.
  - Los servicios Angular con `{ providedIn: 'root' }` son singleton. Al hacer navegación SPA (`this.router.navigate(['/login'])`) sin recarga completa de página (`window.location`), el `signal<CompanyDto | null>(...)` de `activeCompany` y `assignedCompanies` **permanece en la memoria RAM del navegador con los datos del usuario anterior**.

### Finding 2: Bypass de Selección de Empresa en `LoginComponent` para Usuarios Multi-Empresa
- En `frontend/src/app/features/auth/login.component.ts` (`onSubmit()`):
  ```typescript
  } else if (companies.length > 1) {
    const currentActive = this.companyService.activeCompany();
    if (currentActive && companies.some(c => c.id === currentActive.id)) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/select-company']);
    }
  }
  ```
  - Cuando se autentica `SuperAdmin`, el backend le devuelve **todas las empresas**.
  - Como `currentActive` sigue teniendo en memoria la empresa del usuario anterior (ej. la clínica odontológica), la condición `companies.some(c => c.id === currentActive.id)` resulta **verdadera**.
  - En consecuencia, el sistema nunca solicita al SuperAdmin seleccionar empresa (`/select-company`), omite el refresco de contexto y navega directamente a `/dashboard` **manteniendo como tenant activo la empresa del usuario previo**.

### Finding 3: Inyección del Header `X-Company-Id` heredado en todas las peticiones
- En `frontend/src/app/core/interceptors/auth-tenant.interceptor.ts`:
  ```typescript
  const companyId = companyService.activeCompanyId();
  if (companyId) {
    headers = headers.set('X-Company-Id', companyId);
  }
  ```
  - Al quedarse la empresa del usuario anterior en `activeCompany`, todas las peticiones HTTP del nuevo usuario (`SuperAdmin`) envían el `X-Company-Id` de la empresa previa.
  - El backend (`TenantResolutionMiddleware`) fija `companyContext.SetCompany(companyId)`, haciendo que todos los filtros globales (áreas, empleados, citas, pacientes) muestren únicamente los datos de la empresa anterior.

### Finding 4: Ausencia de Features en `AuthService.LoginAsync` (Backend)
- En `backend/MedApp.Application/Services/AuthService.cs`:
  - En la consulta de `allCompanies` (SuperAdmin) y `userCompanies` (otros roles), no se realiza `.Include(c => c.Features)`.
  - La proyección `CompanyDto` omite el diccionario de `Features` (queda en `null`).
  - Esto provocaba que si el frontend intentaba evaluar permisos de empresa (`hasScheduling`, `hasLaboratory`, etc.) o reutilizaba el objeto en caché, se quedara con los permisos y feature flags viejos o desactualizados.

---

## 3. Decisión Arquitectónica

1. **Aislamiento Total de Sesión en Frontend:**
   - Crear un método centralizado `clearSession()` en `AuthService` que interactúe directamente con `CompanyContextService` para limpiar de forma garantizada tanto el almacenamiento persistente (`localStorage`) como los Signals en memoria (`token`, `currentUser`, `activeCompany`, `assignedCompanies`).
   - Invocar esta limpieza total:
     1. En `AuthService.logout()`.
     2. En `LoginComponent.ngOnInit()` (si se llega a la ruta `/login`, cualquier estado previo se invalida preventivamente).
     3. Inmediatamente antes de procesar el éxito de una nueva autenticación en `AuthService.handleAuthSuccess()`.

2. **Regla de Redirección Estricta en Login:**
   - Al iniciar sesión con un usuario nuevo, **nunca asumir que hay una empresa previamente seleccionada**.
   - Si el usuario tiene **1 sola empresa asignada**, asignarla explícitamente (`setActiveCompany(companies[0])`) y navegar al dashboard.
   - Si el usuario tiene **múltiples empresas o es SuperAdmin**, limpiar cualquier empresa activa previa y navegar obligatoriamente a `/select-company` para que el usuario elija conscientemente el tenant en el cual operará.

3. **Inclusión de Feature Flags en `AuthService.LoginAsync` (Backend):**
   - Incluir `.Include(c => c.Features)` en las consultas de `allCompanies` y `userCompanies`.
   - Proyectar `Features = c.Features.ToFeaturesDictionary()` en la lista `assignedCompanies` del `LoginResponseDto`.
   - Así, el frontend siempre dispone de los flags de empresa frescos e independientes de cachés previos.

4. **Sincronización en `CompanyContextService`:**
   - Agregar método `resetContext()` para poner en `null`/`[]` todos los signals y limpiar `localStorage`.
   - En `loadMyCompanies()` y `loadAllCompanies()`, si ya existe un `activeCompany`, actualizar su referencia en el Signal con el objeto recién traído del servidor para refrescar los feature flags en caliente si fueron modificados.

---

## 4. Nuevas Ideas y Valor Agregado
- **Feedback visual explícito en Shell:** Al ingresar como SuperAdmin, mostrar en la barra superior o en el selector de empresa que tiene privilegios globales y permitirle cambiar de empresa en cualquier momento sin perder permisos.
- **Limpieza de interceptores:** Si no hay empresa activa, no enviar cabecera `X-Company-Id` inválida o vacía.

---

## 5. Especificación Técnica por Capas

### Backend (.NET 8)
- `backend/MedApp.Application/Services/AuthService.cs`:
  - Incluir `.Include(c => c.Features)` en la carga de empresas para SuperAdmin y usuarios estándar.
  - Mapear `c.Features.ToFeaturesDictionary()` al construir los `CompanyDto`.

### Frontend (Angular Standalone)
- `frontend/src/app/core/services/company-context.service.ts`:
  - Añadir método `resetContext()`: limpia `activeCompany.set(null)`, `assignedCompanies.set([])` y remueve `medapp_active_company` de `localStorage`.
  - Enriquecer `loadMyCompanies` y `loadAllCompanies` para refrescar los features del `activeCompany` actual si su ID coincide.
- `frontend/src/app/core/services/auth.service.ts`:
  - Inyectar `CompanyContextService`.
  - En `logout()`, invocar `companyService.resetContext()`.
  - En `handleAuthSuccess()`, asegurar que el contexto de empresa anterior se limpie antes de iniciar la nueva sesión.
- `frontend/src/app/features/auth/login.component.ts`:
  - Implementar `OnInit` para invocar la limpieza preventiva de sesión previa.
  - En `onSubmit()`, si `companies.length > 1`, redirigir incondicionalmente a `/select-company`. Si `companies.length === 1`, activar dicha empresa y navegar a `returnUrl`.

---

## 6. Plan de Pruebas
1. **Pruebas Automatizadas:**
   - Ejecutar suite completa `dotnet test backend/MedApp.slnx` (asegurar 29/29 o superior pasando).
   - Ejecutar compilación de frontend `npx ng build` para validar tipado estricto y signals.
2. **Pruebas Manuales / Casos de Verificación:**
   - Iniciar sesión como `recepcion_dental` (Rol Receptionist, Empresa Odontológica). Verificar que muestra los menús de recepcionista de dicha clínica.
   - Cerrar sesión.
   - Iniciar sesión como `admin` (SuperAdmin).
   - Verificar que **no** hereda la clínica odontológica automáticamente, sino que es dirigido a `/select-company` o inicia con contexto limpio.
   - Al seleccionar cualquier empresa, verificar que los roles y permisos mostrados en la esquina superior derecha (`👑 Super Admin`) y en la barra lateral son los de SuperAdmin (acceso a Empresas, Usuarios, Catálogo, Auditoría, etc.).
