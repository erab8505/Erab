# Tareas 005: Adaptación de Acciones y Expediente Clínico para Empresas con Sólo Laboratorio

## Metadatos
- **ID:** 005-lab-only-company-actions-and-patient-detail
- **Plan de Referencia:** [plans/005-lab-only-company-actions-and-patient-detail.md](../plans/005-lab-only-company-actions-and-patient-detail.md)
- **Progreso:** [4/4] tareas completadas (100%)

---

## Matriz de Tareas

### Fase 1: Directorio de Pacientes
- [x] `TASK-005-01`: Condicionar acciones de agendamiento y estudio en el Directorio de Pacientes.
  - **Archivos:** `frontend/src/app/features/patients/patient-list.component.ts`
  - **Criterio de Aceptación:** Ocultar el botón `🗓️ Agendar` en cada fila si la empresa no tiene habilitado el módulo de citas. Mostrar `🧪 Estudio` y `+ Orden de Estudio` solo si la empresa tiene habilitado laboratorio (o SuperAdmin).

### Fase 2: Expediente del Paciente (Detalle)
- [x] `TASK-005-02`: Actualizar acciones de cabecera en el Expediente del Paciente.
  - **Archivos:** `frontend/src/app/features/patients/patient-detail.component.ts`
  - **Criterio de Aceptación:** Ocultar el botón `🗓️ Agendar Cita` si la empresa no tiene módulo de citas. Agregar y destacar el botón `Agregar Estudio` como acción principal (`btn-primary`) cuando la empresa sea de sólo laboratorio.
- [x] `TASK-005-03`: Restringir pestañas a Datos Personales y Estudios en empresas de sólo laboratorio.
  - **Archivos:** `frontend/src/app/features/patients/patient-detail.component.ts`, `frontend/src/app/features/dashboard/dashboard.component.ts`
  - **Criterio de Aceptación:** Si la empresa no tiene agendamiento, ocultar las pestañas `Citas`, `Historia Clínica`, `Recetas y Fórmulas` y `Archivos Adjuntos`, mostrando únicamente `📋 Datos Personales` y `🧪 Estudios y Laboratorio`. Omitir peticiones HTTP innecesarias en `loadAllData()`.

### Fase 3: Validación y Entrega
- [x] `TASK-005-04`: Ejecución de pruebas y generación de Walkthrough.
  - **Archivos:**
    - `walkthroughs/005-lab-only-company-actions-and-patient-detail.md`
  - **Criterio de Aceptación:** Compilación de frontend (`npx ng build`) y backend (`dotnet test`) pasando con 0 errores, y walkthrough completado.
