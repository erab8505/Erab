# Plan 007: Integrar Emisión de Receta en el Modal de Consulta Directa (Historia Clínica)

- **Fecha:** 2026-09-25
- **Estado:** Pendiente de Aprobación
- **Tareas Asociadas:** [tasks/007-attach-prescription-to-direct-consultation.md](../tasks/007-attach-prescription-to-direct-consultation.md)

---

## 1. Requerimiento Original

> "¿Me recuerdas por qué Registrar Consulta / Atención Médica no tiene la opción de agregar receta? ¿Esa opción que se abre con modals?" -> "Sí, elabora el plan."

El usuario solicita unificar la experiencia de atención clínica: al igual que ocurre en el flujo de **Atender Cita** en agendamiento, el modal de **Registrar Consulta / Atención Médica** en el expediente (Historia Clínica) debe contar con el banner y modal encadenado para emitir y adjuntar una fórmula médica en el mismo acto clínico.

---

## 2. Diagnóstico del Estado Actual (Findings)

1. **Flujo Existente en Agendamiento (`scheduling-list.component.ts`):**
   - En el modal de atención de cita existe la tarjeta `.rx-banner-card` con el botón `💊 + Emitir Receta` / `📝 Ver / Editar Receta`.
   - Al pulsar ese botón, se abre el modal encadenado de prescripción (`zIndex = 70`) que permite gestionar la lista de medicamentos (fármaco, dosis, frecuencia, duración, indicaciones) y notas generales de la receta.
   - Al guardar la atención, el sistema envía concurrentemente el registro médico (`POST /api/medical-records`) y la receta médica (`POST /api/prescriptions`), vinculando ambos al paciente y especialista.
2. **Estado Actual en Historia Clínica (`medical-record-modal.component.ts` y `patient-detail.component.ts`):**
   - El modal `app-medical-record-modal` solo captura diagnóstico, tratamiento, notas de evolución y signos vitales.
   - No cuenta con la sección para adjuntar receta.
   - El médico debía guardar la consulta, cambiar de pestaña a "💊 Recetas y Fórmulas" y pulsar "+ Nueva Receta" de forma separada y redundante.

---

## 3. Decisión Arquitectónica

Integrar de forma cohesiva el flujo de prescripción en `medical-record-modal.component.ts`:
1. **Banner Interactivo en Modal de Consulta:**
   - Incorporar debajo de los signos vitales el componente visual `.rx-banner-card`:
     - Estado sin receta: `💊 + Emitir Receta`
     - Estado con receta: `📝 Ver / Editar Receta ({N})` y botón `✕ Quitar`.
2. **Modal Encadenado de Prescripción y Medicación:**
   - Permitir al médico abrir el modal de receta (`[zIndex]="70"`) para ingresar medicamentos (apoyado en el modal de fármaco `app-medication-modal` con `[zIndex]="90"` si aplica, o interfaz fluida de captura).
   - Capturar notas o indicaciones generales de la receta.
3. **Persistencia Unificada en `PatientDetailComponent`:**
   - Al hacer clic en "Guardar Atención Clínica", `medical-record-modal` emite tanto los datos de la nota médica como los datos de la receta adjunta (si existen medicamentos).
   - `patient-detail.component.ts` persiste la consulta vía `POST /api/medical-records` y, de existir receta, la formula vía `POST /api/prescriptions`.
   - Refresca tanto la lista de historias clínicas como la lista de recetas del expediente, mostrando un toast de confirmación completo: *"Consulta clínica y receta médica registradas exitosamente."*

---

## 4. Especificación Técnica por Capas

### Frontend (Angular Standalone)
1. **`frontend/src/app/features/patients/components/medical-record-modal.component.ts`:**
   - Importar `MedicationModalComponent` y componentes necesarios.
   - Incorporar señales reactivas para el estado de la receta pendiente:
     - `pendingPrescriptionItems = signal<CreatePrescriptionItemDto[]>([]);`
     - `prescriptionNotes = signal<string>('');`
     - `prescriptionSubModalOpen = signal<boolean>(false);`
     - `medicationModalOpen = signal<boolean>(false);`
   - Incorporar la tarjeta `.rx-banner-card` en el template principal del formulario.
   - Incorporar el sub-modal de receta (`[zIndex]="70"`) con la tabla de medicamentos, notas y botón de confirmación.
   - Incorporar `app-medication-modal` (`[zIndex]="90"`) para añadir/editar fármacos.
   - En el método `submit()`, emitir el payload combinado: `{ record: {...}, prescription: rxPayload | null }`.
   - En `close()`, limpiar el estado temporal de la receta.

2. **`frontend/src/app/features/patients/patient-detail.component.ts`:**
   - Actualizar el método `saveRecord(event: { record: any, prescription?: any })`:
     - Realizar `POST /api/medical-records`.
     - Si `prescription` contiene medicamentos, ejecutar `POST /api/prescriptions` de forma encadenada mediante RxJS (`switchMap` / `forkJoin`).
     - Al completar, refrescar todos los datos del paciente (`loadAllData(id)`) y mostrar mensaje de éxito apropiado.

---

## 5. Plan de Pruebas

### Pruebas Automatizadas
1. **Backend Tests:**
   ```powershell
   dotnet test backend/MedApp.slnx
   ```
   Verificar que todos los tests continúen pasando con 0 errores (29/29).
2. **Frontend Build:**
   ```powershell
   npx ng build --configuration=development
   ```
   Validar que no existan errores de tipos, imports ni templates.

### Verificación Manual
1. Iniciar sesión como especialista (`dr_felipe`) o administrador (`admin_dental`).
2. Ir a **Pacientes** -> Abrir **Expediente** -> Pestaña **Historia Clínica**.
3. Hacer clic en **`+ Registrar Consulta / Evolución`**.
4. Llenar diagnóstico y signos vitales.
5. Observar la sección **💊 Receta / Fórmula Médica** y hacer clic en **`💊 + Emitir Receta`**.
6. Agregar al menos 1 medicamento con dosis, frecuencia y duración.
7. Confirmar la receta y verificar que el banner principal muestra: *"1 medicamento(s) adjunto(s) a la fórmula médica"*.
8. Pulsar **Guardar Atención Clínica**.
9. Verificar que:
   - En la pestaña **Historia Clínica** aparece la nueva consulta médica.
   - En la pestaña **Recetas y Fórmulas** aparece la nueva receta emitida con el botón de imprimir.
