# Plan 004: Visibilidad y Acceso Completo de Enlaces del Menú de Navegación para SuperAdmin

## Metadatos
- **ID:** 004-superadmin-navigation-menu-links
- **Fecha:** 2026-09-25
- **Estado:** En Revisión / Listo para Ejecución
- **Tareas Asociadas:** [tasks/004-superadmin-navigation-menu-links.md](../tasks/004-superadmin-navigation-menu-links.md)

---

## 1. Requerimiento Original
> "superadmin no esta viendo todos los links en el nav menu"

El usuario reporta que al iniciar sesión con el rol de `SuperAdmin`, no están visibles todos los enlaces del menú de navegación lateral (`app-sidebar`).

---

## 2. Hallazgos en el Codebase (Findings)

### Finding 1: Condicionales en `ShellComponent` bloquean enlaces si la empresa activa no tiene el feature flag
- En `frontend/src/app/layout/shell.component.ts`:
  ```html
  @if (authService.canAccessScheduling() && companyService.hasScheduling()) {
    <a routerLink="/scheduling">Agenda y Citas</a>
  }

  @if ((authService.canAccessStudies() || authService.isReceptionist()) && companyService.hasLaboratory()) {
    <a routerLink="/studies">Estudios y Laboratorio</a>
  }

  @if (authService.isAdmin()) {
    @if (companyService.hasLaboratory()) {
      <a routerLink="/studies/catalog">Catálogo de Estudios</a>
    }
  }
  ```
- **Causa Raíz:** Tanto `Clínica Central Demo` como `Clínica Odontológica Sonrisas & Salud` tienen configurado `MODULE_LABORATORY = False` en base de datos.
- Como la condición exigía estrictamente `companyService.hasLaboratory()`, los enlaces de:
  - **"Estudios y Laboratorio"** (`/studies`)
  - **"Catálogo de Estudios"** (`/studies/catalog`)
  quedan completamente ocultos para el `SuperAdmin`.
- Asimismo, si una empresa tuviera `MODULE_SCHEDULING = False`, el enlace de **"Agenda y Citas"** (`/scheduling`) también se ocultaba para el SuperAdmin.

### Finding 2: `moduleGuard` bloquea el acceso por URL directa a SuperAdmin si el feature está desactivado en la empresa
- En `frontend/src/app/core/guards/module.guard.ts`:
  ```typescript
  export const moduleGuard = (featureKey: string, moduleName: string = 'este módulo'): CanActivateFn => {
    return () => {
      const companyService = inject(CompanyContextService);
      if (companyService.hasFeature(featureKey)) {
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    };
  };
  ```
- `moduleGuard` no valida si el usuario es `SuperAdmin`. Si el `SuperAdmin` intenta navegar directamente a `/studies`, `/studies/catalog` o `/scheduling`, es rechazado con advertencia y redirigido al dashboard.

### Finding 3: Privilegios de SuperAdmin en una Arquitectura Multi-Empresa
- El rol `SuperAdmin` es el administrador supremo de la plataforma médica. Su rol exige:
  - Administrar el catálogo global de estudios, exámenes y parámetros (`/studies/catalog`) en cualquier momento.
  - Supervisar órdenes de laboratorio (`/studies`) y agendas (`/scheduling`) de todas las empresas.
  - Administrar empresas, áreas, especialidades, empleados, procedimientos, usuarios y auditoría.
- Por tanto, el `SuperAdmin` debe tener visibilidad y acceso irrestricto a todos los enlaces del menú lateral, independientemente de los feature flags de la empresa tenant activa.

---

## 3. Decisión Arquitectónica

1. **Permiso Maestro para SuperAdmin en `ShellComponent`:**
   - En el menú lateral (`app-sidebar`), modificar las condiciones `@if`:
     - **Agenda y Citas:** `@if (authService.isSuperAdmin() || (authService.canAccessScheduling() && companyService.hasScheduling()))`
     - **Estudios y Laboratorio:** `@if (authService.isSuperAdmin() || ((authService.canAccessStudies() || authService.isReceptionist()) && companyService.hasLaboratory()))`
     - **Catálogo de Estudios:** `@if (authService.isSuperAdmin() || (authService.isAdmin() && companyService.hasLaboratory()))`
   - Esto garantiza que el `SuperAdmin` vea siempre el 100% de los módulos del sistema (Inicio, Pacientes, Agenda y Citas, Estudios y Laboratorio, Catálogo de Estudios, Empresas, Áreas, Especialidades, Empleados, Procedimientos, Usuarios y Auditoría).
   - Los roles específicos de empresa (Admin de clínica, Especialista, Recepcionista, Laboratorista) continuarán respetando los feature flags de su respectiva clínica.

2. **Bypass de SuperAdmin en `moduleGuard`:**
   - En `frontend/src/app/core/guards/module.guard.ts`:
     - Inyectar `AuthService`.
     - Si `authService.isSuperAdmin()` es `true`, permitir el acceso incondicional (`return true;`).
     - Para los demás usuarios, mantener la comprobación `companyService.hasFeature(featureKey)`.

---

## 4. Especificación Técnica por Capas

### Frontend (Angular Standalone)
- `frontend/src/app/layout/shell.component.ts`:
  - Actualizar directivas `@if` de navegación para incluir `authService.isSuperAdmin()`.
- `frontend/src/app/core/guards/module.guard.ts`:
  - Permitir el paso incondicional a `SuperAdmin`.

---

## 5. Plan de Pruebas
1. **Pruebas Automatizadas:**
   - `dotnet test backend/MedApp.slnx`: 29 tests pasando con 0 errores.
   - `npx ng build`: Compilación de producción limpia sin errores.
2. **Pruebas Manuales / Casos de Verificación:**
   - Iniciar sesión como `admin` (SuperAdmin) y seleccionar `Clínica Central Demo` (que tiene laboratorio en `False`).
   - Verificar que en el menú lateral aparecen **todos** los links:
     1. Inicio
     2. Pacientes
     3. Agenda y Citas
     4. Estudios y Laboratorio
     5. Catálogo de Estudios
     6. Empresas
     7. Áreas
     8. Especialidades
     9. Empleados
     10. Procedimientos
     11. Usuarios
     12. Trazabilidad / Auditoría
   - Hacer clic en `Catálogo de Estudios` y `Estudios y Laboratorio` y verificar que ingresa correctamente sin bloqueo por `moduleGuard`.
