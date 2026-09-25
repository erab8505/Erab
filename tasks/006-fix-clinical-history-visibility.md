# Tareas 006: Visibilidad de Historia Clínica con Módulo de Agendamiento Activo

- **Plan Asociado:** [plans/006-fix-clinical-history-visibility.md](../plans/006-fix-clinical-history-visibility.md)
- **Progreso General:** [4/4] tareas completadas (100%)

---

## Matriz de Tareas

### Fase 1: Backend (.NET 8)
- [x] `TASK-006-01`: Registrar política `RequireClinicalOrReceptionistRole` y actualizar granularmente las políticas en `MedicalRecordsController.cs`.
  - **Archivos:**
    - `backend/MedApp.Infrastructure/DependencyInjection.cs`
    - `backend/MedApp.Api/Controllers/MedicalRecordsController.cs`
  - **Criterio de Aceptación:**
    - `GET /api/medical-records` y `GET /api/medical-records/{id}` permiten acceso a `SuperAdmin`, `Admin`, `Specialist` y `Receptionist`.
    - `POST` y `PUT` continúan restringidos a `SuperAdmin`, `Admin` y `Specialist`.

- [x] `TASK-006-02`: Actualizar suite de pruebas de integración de autorización clínica.
  - **Archivos:**
    - `backend/MedApp.Tests/ClinicalAuthorizationTests.cs`
  - **Criterio de Aceptación:**
    - El test verifica que `Receptionist` obtiene `200 OK` al consultar historia clínica y `403 Forbidden` al intentar crear registros clínicos.
    - `dotnet test backend/MedApp.slnx` pasa con 0 errores.

---

### Fase 2: Frontend (Angular)
- [x] `TASK-006-03`: Habilitar permiso de lectura en `AuthService` y verificar comportamiento en `patient-detail.component.ts`.
  - **Archivos:**
    - `frontend/src/app/core/services/auth.service.ts`
    - `frontend/src/app/features/patients/patient-detail.component.ts`
  - **Criterio de Aceptación:**
    - `canViewMedicalRecords()` incluye `Receptionist`.
    - `canCreateMedicalRecords()` se mantiene solo para roles clínicos (`SuperAdmin`, `Admin`, `Specialist`).
    - En el componente de expediente (`patient-detail.component.ts`), la pestaña de Historia Clínica se renderiza cuando `hasSchedulingModule()` es activo.

---

### Fase 3: Validación y Entrega
- [x] `TASK-006-04`: Ejecución de pruebas integrales y generación del documento de entrega.
  - **Archivos:**
    - `walkthroughs/006-fix-clinical-history-visibility.md`
  - **Criterio de Aceptación:**
    - `dotnet test backend/MedApp.slnx` exitoso (0 fallos).
    - `npx ng build` compila con éxito.
    - Walkthrough 006 documentado con evidencias y tabla de cambios.
