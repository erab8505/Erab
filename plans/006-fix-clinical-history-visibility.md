# Plan 006: Visibilidad de Historia Clínica con Módulo de Agendamiento Activo

- **Fecha:** 2026-09-25
- **Estado:** Pendiente de Aprobación
- **Tareas Asociadas:** [tasks/006-fix-clinical-history-visibility.md](../tasks/006-fix-clinical-history-visibility.md)

---

## 1. Requerimiento Original

> "¿Qué sucedió con la historia clínica? No se mira la historia clínica con `MODULE_SCHEDULING = True`."

El usuario reporta que al encontrarse en una empresa que tiene habilitado el módulo de agendamiento (`MODULE_SCHEDULING = True`), la pestaña de "Historia Clínica" no se visualiza en el expediente del paciente (`/patients/:id`).

---

## 2. Diagnóstico y Causa Raíz (Findings)

Al inspeccionar minuciosamente el frontend y backend se identificó el origen exacto del problema:

1. **Permiso de Rol en Frontend (`auth.service.ts`):**
   - El método `canViewMedicalRecords()` estaba restringido a:
     ```typescript
     canViewMedicalRecords(): boolean {
       return this.hasRole(['SuperAdmin', 'Admin', 'Specialist']);
     }
     ```
   - Al probar el flujo clínico típico con el usuario recepcionista de la clínica (`recepcion_dental` con rol `Receptionist` en *Clínica Odontológica Sonrisas & Salud* donde `MODULE_SCHEDULING = True`):
     - `canAccessScheduling()` incluye `Receptionist` -> Muestra pestaña "Citas"
     - `canViewPrescriptions()` incluye `Receptionist` -> Muestra pestaña "Recetas y Fórmulas"
     - `canViewDocuments()` incluye `Receptionist` -> Muestra pestaña "Archivos Adjuntos"
     - `canViewMedicalRecords()` **NO incluye `Receptionist`** -> **Oculta completamente la pestaña "Historia Clínica"**.
2. **Cierre de Brecha en Backend (`MedicalRecordsController.cs`):**
   - El controlador `MedicalRecordsController` tenía la política a nivel de clase:
     `[Authorize(Policy = "RequireClinicalRole")]`
     Donde `RequireClinicalRole` solo autoriza a `SuperAdmin`, `Admin` y `Specialist`.
   - Esto provocaba que cualquier intento de consultar `/api/medical-records?patientId={id}` por parte de un recepcionista devolviera un error HTTP `403 Forbidden`.
   - Adicionalmente, el test de integración `ClinicalAuthorizationTests.cs` validaba explícitamente `Receptionist_AccessingMedicalRecords_Returns403Forbidden`.

---

## 3. Decisión Arquitectónica

### Alternativas Consideradas:
1. **Alternativa A: Exigir que el recepcionista no vea la historia clínica y obligar a iniciar sesión como Especialista/Admin.**
   - *Desventaja:* En el flujo operativo de consultorios y clínicas, el personal de recepción necesita consultar los antecedentes y notas previas de evolución del paciente para coordinar admisiones, interconsultas y seguimiento.
2. **Alternativa B (Recomendada): Acceso de Lectura a Recepcionistas con Bloqueo Estricto de Escritura.**
   - Permitir que el rol `Receptionist` consulte la historia clínica en modo solo lectura (`GET /api/medical-records`), mientras que la creación (`POST`) y modificación (`PUT`) de atenciones clínicas, signos vitales y diagnósticos permanezcan restringidas exclusivamente a roles clínicos (`SuperAdmin`, `Admin`, `Specialist`).
   - En el frontend, el botón "+ Registrar Consulta / Evolución" se mantiene oculto para `Receptionist` mediante `canCreateClinical()` / `canCreateMedicalRecords()`.

---

## 4. Especificación Técnica por Capas

### Backend (.NET 8)
1. **`MedApp.Infrastructure/DependencyInjection.cs`:**
   - Registrar una nueva política de autorización:
     ```csharp
     options.AddPolicy("RequireClinicalOrReceptionistRole", policy =>
         policy.RequireRole("SuperAdmin", "Admin", "Specialist", "Receptionist"));
     ```
2. **`MedApp.Api/Controllers/MedicalRecordsController.cs`:**
   - Quitar la restricción global de clase `[Authorize(Policy = "RequireClinicalRole")]` y aplicarla de forma granular:
     - Endpoints de consulta (`GetMedicalRecords`, `GetMedicalRecordById`): protegidos con `[Authorize(Policy = "RequireClinicalOrReceptionistRole")]`.
     - Endpoints de mutación (`CreateMedicalRecord`, `UpdateMedicalRecord`, `DeleteMedicalRecord`): protegidos con `[Authorize(Policy = "RequireClinicalRole")]`.
3. **`MedApp.Tests/ClinicalAuthorizationTests.cs`:**
   - Actualizar el test `Receptionist_AccessingMedicalRecords` para comprobar que:
     - `GET /api/medical-records?patientId={id}` retorna `200 OK` con la lista de notas médicas.
     - `POST /api/medical-records` continúa retornando `403 Forbidden` (garantía de seguridad clínica).

### Frontend (Angular Standalone)
1. **`frontend/src/app/core/services/auth.service.ts`:**
   - Actualizar `canViewMedicalRecords()` para incluir `Receptionist`:
     ```typescript
     canViewMedicalRecords(): boolean {
       return this.hasRole(['SuperAdmin', 'Admin', 'Specialist', 'Receptionist']);
     }
     ```
   - Mantener `canCreateMedicalRecords()` restringido a `['SuperAdmin', 'Admin', 'Specialist']`.
2. **`frontend/src/app/features/patients/patient-detail.component.ts`:**
   - Verificar que al estar habilitado `hasSchedulingModule()` y cumplirse `canViewMedicalRecords()`, la pestaña "🩺 Historia Clínica" se renderice para todos los roles habilitados.
   - En el componente `app-patient-records-tab`, la acción de registro permanece protegida con `canCreate`.

---

## 5. Plan de Pruebas

### Pruebas Automatizadas
1. **Backend Tests:**
   ```powershell
   dotnet test backend/MedApp.slnx
   ```
   Validar que todos los tests pasen con 0 errores, incluyendo la nueva prueba de lectura permitida y escritura denegada para `Receptionist`.
2. **Frontend Build:**
   ```powershell
   npx ng build --configuration=development
   ```
   Validar que el bundle de Angular compile limpiamente.

### Verificación Manual
1. Iniciar sesión con `recepcion_dental` (empresa con `MODULE_SCHEDULING = True`).
2. Ir a **Pacientes** -> Seleccionar un paciente -> Ver **Expediente**.
3. Confirmar que la pestaña **"🩺 Historia Clínica (X)"** aparece visible junto a Datos Personales, Citas, Recetas, Estudios y Documentos.
4. Entrar a la pestaña y verificar que se visualizan las notas de evolución histórica en modo lectura sin el botón de registrar nueva consulta.
5. Iniciar sesión con `admin_dental` o `dr_felipe` y verificar que sí cuentan con el botón "+ Registrar Consulta / Evolución".
