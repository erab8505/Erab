# Tareas 003: Corrección de Persistencia de Sesión, Caché en Memoria y Contexto de Empresa en Login

## Metadatos
- **ID:** 003-fix-session-and-company-cache-on-login
- **Plan de Referencia:** [plans/003-fix-session-and-company-cache-on-login.md](../plans/003-fix-session-and-company-cache-on-login.md)
- **Progreso:** [4/4] tareas completadas (100%)

---

## Matriz de Tareas

### Fase 1: Backend - Inclusión de Features en Login
- [x] `TASK-003-01`: Cargar e incluir Features de empresas en `AuthService.LoginAsync`.
  - **Archivos:** `backend/MedApp.Application/Services/AuthService.cs`
  - **Criterio de Aceptación:** Tanto para SuperAdmin (`allCompanies`) como para usuarios estándar (`userCompanies`), incluir `.Include(c => c.Features)` y proyectar `Features = c.Features.ToFeaturesDictionary()` en los `CompanyDto` del `LoginResponseDto`.

### Fase 2: Frontend - Limpieza de Estado y Sincronización en Servicios
- [x] `TASK-003-02`: Agregar `resetContext()` y sincronización de features en `CompanyContextService`.
  - **Archivos:** `frontend/src/app/core/services/company-context.service.ts`
  - **Criterio de Aceptación:** Implementar `resetContext()` que limpie `activeCompany`, `assignedCompanies` y elimine la clave de `localStorage`. En `loadMyCompanies` y `loadAllCompanies`, si ya existe un `activeCompany`, actualizar sus propiedades con la entidad coincidente del servidor.
- [x] `TASK-003-03`: Integrar limpieza completa de sesión en `AuthService` y navegación controlada en `LoginComponent`.
  - **Archivos:** 
    - `frontend/src/app/core/services/auth.service.ts`
    - `frontend/src/app/features/auth/login.component.ts`
  - **Criterio de Aceptación:** 
    - `AuthService.logout()` y `handleAuthSuccess()` llaman a `companyService.resetContext()` para garantizar que no quede ningún residuo del usuario anterior.
    - `LoginComponent` limpia preventivamente sesiones residuales en `ngOnInit()`.
    - Al autenticar un usuario con múltiples empresas o SuperAdmin, dirigirlo a `/select-company` para selección explícita del tenant.

### Fase 3: Validación y Pruebas
- [x] `TASK-003-04`: Ejecución de pruebas y generación de Walkthrough.
  - **Archivos:**
    - `backend/MedApp.Tests/`
    - `frontend/`
    - `walkthroughs/003-fix-session-and-company-cache-on-login.md`
  - **Criterio de Aceptación:** `dotnet test` pasa con 0 errores (29+ pruebas), `npx ng build` compila con éxito y el walkthrough documenta los archivos intervenidos y los pasos de prueba.
