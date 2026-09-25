# Walkthrough 005: Adaptación de Acciones y Expediente Clínico para Empresas con Sólo Laboratorio

## 1. Resumen de la Entrega
Se implementaron las reglas de negocio y adaptaciones visuales solicitadas para empresas que operan exclusivamente con el módulo de Laboratorio (`MODULE_LABORATORY = True` y `MODULE_SCHEDULING = False`).

### Principales Mejoras y Ajustes
1. **Directorio de Pacientes (`/patients`):**
   - Se ocultó el botón `🗓️ Agendar` en las acciones de cada paciente cuando la empresa no cuenta con el módulo de agendamiento/citas.
   - Se condicionó el botón `🧪 Estudio` y el botón superior `+ Orden de Estudio` para que aparezcan cuando la empresa cuenta con laboratorio (o cuando el usuario es SuperAdmin).
2. **Expediente del Paciente (`/patients/:id`):**
   - **Acciones de Cabecera:** Se ocultó el botón `🗓️ Agendar Cita`. Se promovió y destacó el botón **"Agregar Estudio"** (`+ Orden de Estudio`) como acción principal (`btn-primary`) cuando la empresa no maneja citas.
   - **Pestañas:** Cuando la empresa opera sólo con laboratorio, se muestran **únicamente** dos pestañas:
     1. `📋 Datos Personales`
     2. `🧪 Estudios y Laboratorio`
     Se ocultaron las pestañas clínicas no aplicables (`Citas`, `Historia Clínica`, `Recetas y Fórmulas`, `Archivos Adjuntos`).
   - **Optimización:** En `loadAllData()`, se omiten las peticiones HTTP a endpoints de citas, consultas médicas y recetas cuando no aplica el módulo de agendamiento.
3. **Panel Principal (`/dashboard`):**
   - En la cabecera, se adaptó el botón principal para mostrar **"Órdenes de Estudio"** cuando la empresa opera en modo exclusivo de laboratorio, en lugar de "Nueva Cita".

---

## 2. Matriz de Archivos Afectados

| Capa | Archivo | Acción | Descripción |
| :--- | :--- | :---: | :--- |
| **Frontend - Patients** | [`frontend/src/app/features/patients/patient-list.component.ts`](file:///c:/Erab/frontend/src/app/features/patients/patient-list.component.ts) | **MODIFICADO** | Inyecta `CompanyContextService`, oculta "Agendar" si no hay citas y condiciona "Estudio". |
| **Frontend - Patients** | [`frontend/src/app/features/patients/patient-detail.component.ts`](file:///c:/Erab/frontend/src/app/features/patients/patient-detail.component.ts) | **MODIFICADO** | Oculta "Agendar Cita", destaca "Agregar Estudio", restringe pestañas a Datos Personales y Estudios y optimiza `loadAllData`. |
| **Frontend - Dashboard** | [`frontend/src/app/features/dashboard/dashboard.component.ts`](file:///c:/Erab/frontend/src/app/features/dashboard/dashboard.component.ts) | **MODIFICADO** | Muestra "Órdenes de Estudio" en la cabecera cuando la empresa solo tiene laboratorio. |

---

## 3. Evidencias de Pruebas

### 3.1. Pruebas Backend (`dotnet test backend/MedApp.slnx`)
```text
Serie de pruebas para C:\Erab\backend\MedApp.Tests\bin\Debug\net10.0\MedApp.Tests.dll (.NETCoreApp,Version=v10.0)
1 archivos de prueba en total coincidieron con el patrón especificado.

Correctas! - Con error:     0, Superado:    29, Omitido:     0, Total:    29, Duración: 8 s - MedApp.Tests.dll (net10.0)
```

### 3.2. Compilación Frontend (`npx ng build`)
```text
> Building...
√ Building...
Initial chunk files | Names                         |  Raw size | Estimated transfer size
chunk-UCOZGMFM.js   | -                             | 244.34 kB |                66.21 kB
chunk-VBTF2RRG.js   | -                             |  89.88 kB |                22.68 kB
main-IJMMGSNB.js    | main                          |  62.18 kB |                13.34 kB
styles-4U3XOSXY.css | styles                        |  42.94 kB |                 7.28 kB
chunk-L5GB2VNJ.js   | -                             |   3.90 kB |                 1.10 kB
chunk-TYIOK6YQ.js   | -                             |   1.98 kB |               727 bytes
chunk-HVMKA4LW.js   | -                             | 772 bytes |               772 bytes

Application bundle generation complete. [5.859 seconds] - 2026-09-25T17:33:11.253Z
Output location: C:\Erab\frontend\dist\frontend
```

---

## 4. Guía de Verificación Manual para el Usuario

1. Iniciar sesión con un usuario perteneciente a una empresa de sólo laboratorio (o activar `MODULE_LABORATORY = True` y `MODULE_SCHEDULING = False`).
2. Ir a **Pacientes** (`/patients`):
   - Verificar que en la tabla de pacientes **NO** aparece el botón `🗓️ Agendar`.
   - Verificar que aparece el botón `🧪 Estudio` y el botón superior `+ Orden de Estudio`.
3. Hacer clic en **Expediente** de cualquier paciente (`/patients/:id`):
   - Verificar que en la cabecera superior derecha **NO** aparece el botón `🗓️ Agendar Cita`.
   - Verificar que aparece el botón destacado en azul **"Agregar Estudio"**.
   - Al pulsar "Agregar Estudio", se abre el modal preseleccionando al paciente para emitir la orden.
   - Verificar que en las pestañas **ÚNICAMENTE** se visualizan:
     - `📋 Datos Personales`
     - `🧪 Estudios y Laboratorio`
     (Las pestañas de Citas, Historia Clínica, Recetas y Archivos quedan ocultas).
4. Ir al **Inicio** (`/dashboard`):
   - Verificar que en la cabecera aparece el botón **"Órdenes de Estudio"** en lugar de "Nueva Cita".
