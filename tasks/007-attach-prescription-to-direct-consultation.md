# Tareas 007: Integrar Emisión de Receta en el Modal de Consulta Directa (Historia Clínica)

- **Plan Asociado:** [plans/007-attach-prescription-to-direct-consultation.md](../plans/007-attach-prescription-to-direct-consultation.md)
- **Progreso General:** [3/3] tareas completadas (100%)

---

## Matriz de Tareas

### Fase 1: Componente del Modal Clínico
- [x] `TASK-007-01`: Incorporar banner de receta, submodal de prescripción y modal de medicamentos en `MedicalRecordModalComponent`.
  - **Archivos:**
    - `frontend/src/app/features/patients/components/medication-modal.component.ts`
    - `frontend/src/app/features/patients/components/medical-record-modal.component.ts`
  - **Criterio de Aceptación:**
    - Se visualiza la tarjeta `.rx-banner-card` con el botón `💊 + Emitir Receta`.
    - Al hacer clic, se abre el submodal de receta (`[zIndex]="70"`).
    - Permite agregar, editar y eliminar medicamentos y escribir notas de la receta.
    - El evento `(save)` emite el objeto combinado `{ record, prescription }`.

---

### Fase 2: Coordinación en el Expediente del Paciente
- [x] `TASK-007-02`: Actualizar `PatientDetailComponent` para persistir la consulta y la receta vinculada en una sola transacción fluida.
  - **Archivos:**
    - `frontend/src/app/features/patients/patient-detail.component.ts`
  - **Criterio de Aceptación:**
    - Guarda la consulta médica (`POST /api/medical-records`).
    - Si se incluyó receta, guarda la receta médica (`POST /api/prescriptions`).
    - Refresca el expediente del paciente y notifica con un mensaje de éxito informativo.

---

### Fase 3: Validación y Entrega
- [x] `TASK-007-03`: Ejecución de pruebas integrales y generación del documento de entrega.
  - **Archivos:**
    - `walkthroughs/007-attach-prescription-to-direct-consultation.md`
  - **Criterio de Aceptación:**
    - `dotnet test backend/MedApp.slnx` exitoso (0 fallos).
    - `npx ng build` compila con éxito (0 errores).
    - Documento de entrega 007 generado con matriz de cambios y flujo validado.
