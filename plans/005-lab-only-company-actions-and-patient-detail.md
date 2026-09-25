# Plan 005: Adaptación de Acciones y Expediente Clínico para Empresas con Sólo Laboratorio

## Metadatos
- **ID:** 005-lab-only-company-actions-and-patient-detail
- **Fecha:** 2026-09-25
- **Estado:** En Revisión / Listo para Ejecución
- **Tareas Asociadas:** [tasks/005-lab-only-company-actions-and-patient-detail.md](../tasks/005-lab-only-company-actions-and-patient-detail.md)

---

## 1. Requerimiento Original
> "ahora analizemos las acciones, cuando la empresa solo tiene laboratorio:
> en pacientes, no deberiamos mostrar agendar, 
> en expediente, solo debemos mostrar los datos personales y los estudios, tampoco debemos mostrar el boton agendar cita. la mejor opcion es agregar un boton de agregar estudio
> 
> empieza el plan"

El usuario solicita adaptar la experiencia de usuario y las acciones disponibles cuando una empresa opera exclusivamente con el módulo de Laboratorio (`MODULE_LABORATORY = True` y `MODULE_SCHEDULING = False`):
1. **Directorio de Pacientes (`/patients`):** Ocultar el botón o acción de "Agendar Cita". Mantener la emisión de órdenes de estudio clínico.
2. **Expediente del Paciente (`/patients/:id`):**
   - Ocultar el botón principal "Agendar Cita".
   - Añadir como acción destacada el botón **"Agregar Estudio"** (`+ Orden de Estudio`).
   - En las pestañas de navegación del expediente, mostrar **únicamente** `📋 Datos Personales` y `🧪 Estudios y Laboratorio`, ocultando las pestañas que pertenecen al módulo médico/citas (`Citas`, `Historia Clínica`, `Recetas y Fórmulas`, `Archivos Adjuntos`).

---

## 2. Hallazgos en el Codebase (Findings)

### Finding 1: En `patient-list.component.ts`, la acción "Agendar" se muestra sin verificar el módulo de citas
- En la plantilla de acciones por paciente:
  ```html
  @if (authService.canManagePatients()) {
    <a [routerLink]="['/scheduling/new']" [queryParams]="{ patientId: item.id }" class="btn btn-secondary btn-sm" title="Agendar nueva cita">
      🗓️ Agendar
    </a>
    <a [routerLink]="['/patients', item.id]" class="btn btn-secondary btn-sm">Expediente</a>
    <button type="button" class="btn btn-secondary btn-sm" (click)="openEditModal(item)">Editar</button>
  }
  ```
- **Problema:** Se muestra el botón "Agendar" a pesar de que la clínica no cuente con el módulo de Citas (`MODULE_SCHEDULING`). Si el usuario hace clic, es bloqueado por `moduleGuard`.
- Además, el botón superior `+ Orden de Estudio` y el botón de fila `🧪 Estudio` no verificaban si la empresa tiene habilitado el módulo de laboratorio.

### Finding 2: En `patient-detail.component.ts`, las pestañas clínicas y el botón "Agendar Cita" no están condicionados al módulo de citas
- En la cabecera:
  - Se muestra `🗓️ Agendar Cita` si `authService.canAccessScheduling()`, sin validar `companyService.hasScheduling()`.
  - El botón `+ Orden de Estudio` tiene estilo secundario (`btn-outline-primary`) y está restringido a `authService.canManageStudyOrders()`, ignorando a recepcionistas autorizados para emitir estudios en la empresa.
- En la navegación por pestañas (`tab-nav`):
  - Se renderizan pestañas de `🗓️ Citas`, `🩺 Historia Clínica`, `💊 Recetas y Fórmulas` y `📂 Archivos Adjuntos`.
  - En una empresa de sólo laboratorio (ej. un laboratorio clínico independiente), no existen consultas médicas, agendas de médicos ni recetas. La presencia de estas pestañas genera confusión en los laboratoristas y recepcionistas.
- En la carga de datos (`loadAllData`):
  - Se realizan peticiones `forkJoin` innecesarias a `/schedulings`, `/medical-records` y `/prescriptions` aun cuando la empresa no dispone del módulo.

---

## 3. Decisión Arquitectónica

1. **Condicionamiento de "Agendar" en Pacientes:**
   - En `PatientListComponent`, inyectar `CompanyContextService`.
   - Mostrar el botón `🗓️ Agendar` únicamente si `companyService.hasScheduling() || authService.isSuperAdmin()`.
   - Condicionar los botones `🧪 Estudio` y `+ Orden de Estudio` a `companyService.hasLaboratory() || authService.isSuperAdmin()`.

2. **Reconfiguración del Expediente (`PatientDetailComponent`):**
   - **Acciones de Cabecera:**
     - Ocultar `🗓️ Agendar Cita` cuando `!companyContext.hasScheduling() && !authService.isSuperAdmin()`.
     - Mostrar el botón **"Agregar Estudio"** (`+ Orden de Estudio`) accesible a cualquier usuario con permiso de emisión de estudios (`authService.isSuperAdmin() || authService.canManageStudyOrders() || (authService.isReceptionist() && companyContext.canReceptionistCreateStudies())`).
     - Si la empresa no tiene agendamiento, dicho botón pasará a ser el botón principal de acción (`btn-primary`).
   - **Pestañas Visibles:**
     - Si `!companyContext.hasScheduling() && !authService.isSuperAdmin()`:
       - Mostrar **exclusivamente**:
         1. `📋 Datos Personales`
         2. `🧪 Estudios y Laboratorio`
       - Ocultar `Citas`, `Historia Clínica`, `Recetas y Fórmulas` y `Archivos Adjuntos`.
     - Si la empresa tiene agendamiento (`companyContext.hasScheduling()`) o el usuario es `SuperAdmin`, mantener las pestañas completas según los permisos del usuario.
   - **Optimización de Carga:**
     - En `loadAllData()`, no disparar peticiones HTTP a endpoints de citas, consultas médicas o recetas si `!companyContext.hasScheduling() && !authService.isSuperAdmin()`.

3. **Valor Agregado en Dashboard:**
   - En `dashboard.component.ts`, si la empresa activa no tiene `MODULE_SCHEDULING` pero sí `MODULE_LABORATORY`, cambiar la acción principal de la cabecera de "Nueva Cita" a "Órdenes de Estudio".

---

## 4. Especificación Técnica por Capas

### Frontend (Angular Standalone)
- `frontend/src/app/features/patients/patient-list.component.ts`:
  - Inyectar `CompanyContextService`.
  - En `actionTemplate`, envolver `🗓️ Agendar` en `@if (companyService.hasScheduling() || authService.isSuperAdmin())`.
  - Envolver `🧪 Estudio` y `+ Orden de Estudio` en `@if (companyService.hasLaboratory() || authService.isSuperAdmin())`.
- `frontend/src/app/features/patients/patient-detail.component.ts`:
  - Agregar helper `canCreateStudyOrder(): boolean`.
  - Agregar helper `hasSchedulingModule(): boolean`.
  - Reemplazar botón de cabecera: mostrar `Agregar Estudio` como botón principal cuando no haya módulo de citas.
  - Ocultar `🗓️ Agendar Cita` cuando no exista módulo de citas.
  - En las pestañas: condicionar `appointments`, `records`, `prescriptions` y `documents` a `hasSchedulingModule()`.
  - En `loadAllData()`, omitir consultas HTTP a citas, notas médicas y recetas si `hasSchedulingModule()` es falso.
- `frontend/src/app/features/dashboard/dashboard.component.ts`:
  - Condicionar el botón "Nueva Cita" para que solo aparezca si hay citas disponibles, o mostrar "Órdenes de Estudio" si sólo hay laboratorio.

---

## 5. Plan de Pruebas
1. **Pruebas Automatizadas:**
   - `dotnet test backend/MedApp.slnx` -> 29/29 superadas sin errores.
   - `npx ng build` -> Compilación estricta sin errores de tipado o dependencias.
2. **Pruebas Manuales / Casos de Verificación:**
   - Configurar o seleccionar una empresa con sólo laboratorio (`MODULE_LABORATORY = True`, `MODULE_SCHEDULING = False`).
   - Entrar al Directorio de Pacientes (`/patients`):
     - Validar que en la tabla NO aparece el botón `🗓️ Agendar`.
     - Validar que sí aparece el botón `🧪 Estudio` y `+ Orden de Estudio`.
   - Entrar al Expediente de un Paciente (`/patients/:id`):
     - Validar que en la cabecera NO aparece el botón `🗓️ Agendar Cita`.
     - Validar que en la cabecera aparece el botón destacado `Agregar Estudio` (`btn-primary`).
     - Validar que en la barra de pestañas ÚNICAMENTE aparecen:
       1. `📋 Datos Personales`
       2. `🧪 Estudios y Laboratorio`
     - Validar que al hacer clic en `Agregar Estudio`, se abre el modal preseleccionando al paciente y permite generar la orden.
   - Cambiar a una empresa con todos los módulos (`MODULE_SCHEDULING = True` y `MODULE_LABORATORY = True`):
     - Validar que vuelven a aparecer todas las pestañas habituales y el botón de agendar.
