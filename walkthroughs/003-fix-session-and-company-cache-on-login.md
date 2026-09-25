# Walkthrough 003: Corrección de Persistencia de Sesión, Caché en Memoria y Contexto de Empresa en Login

## 1. Resumen de la Entrega
Se resolvió la anomalía reportada donde, al cerrar sesión y autenticarse con el usuario `SuperAdmin` (o alternar usuarios en la misma sesión del navegador), la aplicación retenía en memoria la empresa activa y los feature flags/permisos correspondientes al usuario anterior.

### Problemas Solucionados
1. **Fuga de Estado en Memoria (SPA):** Al invocar `logout()`, `AuthService` únicamente removía el token y el usuario en `localStorage`, dejando intacto el Signal en memoria de `CompanyContextService.activeCompany`. Al ser Angular una SPA con servicios singleton, cualquier nueva sesión continuaba utilizando la instancia en memoria del tenant previo.
2. **Bypass de Selección de Empresa:** `LoginComponent` verificaba si la empresa en memoria pertenecía a las empresas asignadas al usuario. Como `SuperAdmin` tiene acceso global a todas las empresas, la condición siempre resultaba afirmativa, navegando directamente al dashboard y omitiendo la pantalla de selección `/select-company`.
3. **Peticiones Filtradas por Empresa Errónea:** El interceptor HTTP seguía adjuntando el header `X-Company-Id` de la empresa previa, forzando a que las consultas en base de datos del SuperAdmin se filtraran a la clínica del usuario previo.
4. **Ausencia de Features en Login:** En `AuthService.LoginAsync` del backend, se omitía la carga de `Features`, por lo que el objeto de empresa carecía de los flags de módulos requeridos para habilitar/deshabilitar funcionalidades dinámicamente.

---

## 2. Matriz de Archivos Afectados

| Capa | Archivo | Acción | Descripción |
| :--- | :--- | :---: | :--- |
| **Backend - Application** | [`backend/MedApp.Application/Services/AuthService.cs`](file:///c:/Erab/backend/MedApp.Application/Services/AuthService.cs) | **MODIFICADO** | Incluye `.Include(c => c.Features)` y mapea `c.Features.ToFeaturesDictionary()` en `LoginAsync` tanto para SuperAdmin como para usuarios regulares. |
| **Frontend - Core Services** | [`frontend/src/app/core/services/company-context.service.ts`](file:///c:/Erab/frontend/src/app/core/services/company-context.service.ts) | **MODIFICADO** | Agrega `resetContext()` para limpiar Signals y `localStorage`; sincroniza los features frescos en `loadMyCompanies()` y `loadAllCompanies()`. |
| **Frontend - Core Services** | [`frontend/src/app/core/services/auth.service.ts`](file:///c:/Erab/frontend/src/app/core/services/auth.service.ts) | **MODIFICADO** | Inyecta `CompanyContextService`, implementa `clearSession()` invocado en `logout()` y resetea el contexto en `handleAuthSuccess()`. |
| **Frontend - Features Auth** | [`frontend/src/app/features/auth/login.component.ts`](file:///c:/Erab/frontend/src/app/features/auth/login.component.ts) | **MODIFICADO** | Implementa `OnInit` para limpiar sesiones previas y fuerza la navegación a `/select-company` para usuarios multi-empresa y SuperAdmin. |

---

## 3. Evidencias de Pruebas

### 3.1. Backend (`dotnet test backend/MedApp.slnx`)
```text
Serie de pruebas para C:\Erab\backend\MedApp.Tests\bin\Debug\net10.0\MedApp.Tests.dll (.NETCoreApp,Version=v10.0)
1 archivos de prueba en total coincidieron con el patrón especificado.

Correctas! - Con error:     0, Superado:    29, Omitido:     0, Total:    29, Duración: 7 s - MedApp.Tests.dll (net10.0)
```

### 3.2. Frontend (`npx ng build`)
```text
> Building...
√ Building...
Initial chunk files | Names                         |  Raw size | Estimated transfer size
chunk-UCOZGMFM.js   | -                             | 244.34 kB |                66.21 kB
chunk-VBTF2RRG.js   | -                             |  89.88 kB |                22.68 kB
main-OJ45FA46.js    | main                          |  61.40 kB |                13.30 kB
styles-4U3XOSXY.css | styles                        |  42.94 kB |                 7.28 kB
chunk-L5GB2VNJ.js   | -                             |   3.90 kB |                 1.10 kB
chunk-TYIOK6YQ.js   | -                             |   1.98 kB |               727 bytes
chunk-HVMKA4LW.js   | -                             | 772 bytes |               772 bytes

Application bundle generation complete. [5.326 seconds] - 2026-09-25T16:58:54.860Z
Output location: C:\Erab\frontend\dist\frontend
```

---

## 4. Guía de Verificación Manual para el Usuario

1. Iniciar sesión con un usuario recepcionista o de clínica (ej. `recepcion_dental` / `admin123`).
   - Verificar que en la barra superior aparece la empresa `Clínica Odontológica Sonrisas & Salud` y el rol `📋 Recepcionista`.
2. Hacer clic en **Salir** (cerrar sesión).
3. Iniciar sesión con el usuario SuperAdmin (`admin` / `admin123`).
   - El sistema **no** heredará la clínica odontológica.
   - Será redirigido automáticamente a la pantalla de **Selección de Empresa** (`/select-company`).
   - El badge de usuario mostrará `👑 Super Admin`.
   - Al seleccionar la empresa deseada (ej. `Clínica Central Demo`), todos los menús de administración (`Empresas`, `Áreas`, `Especialidades`, `Empleados`, `Procedimientos`, `Usuarios`, `Trazabilidad / Auditoría`, etc.) estarán completamente activos y cargando los datos correspondientes.
