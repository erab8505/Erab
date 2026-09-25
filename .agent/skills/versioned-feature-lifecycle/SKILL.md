---
name: versioned-feature-lifecycle
description: >-
  Protocolo obligatorio de ciclo de vida de desarrollo para EraB. Se activa ante cualquier nuevo
  requerimiento, característica, refactorización o cambio de negocio. Exige investigar el código,
  generar el plan en plans/, las tareas en tasks/, mantener el estado de progreso y documentar
  la entrega final en walkthroughs/, todo debidamente versionado e indexado numéricamente.
---

# Protocolo de Ciclo de Vida Versionado para EraB

Este protocolo es de cumplimiento obligatorio para todo cambio de negocio, nueva característica o refactorización significativa en la solución EraB.

---

## 1. Regla de Numeración y Nomenclatura

1. **Inspección de Versión:**
   - Antes de iniciar, listar los archivos existentes en `plans/` para identificar el último número secuencial utilizado (ejemplo: si el último es `001-...`, el siguiente será `002-...`).
2. **Formato Numérico:**
   - Siempre usar un prefijo de 3 dígitos con ceros a la izquierda (`001`, `002`, `003`, etc.).
3. **Nomenclatura Idéntica (Trilogía de Documentos):**
   - El nombre base debe ser kebab-case y ser exactamente igual en los 3 directorios:
     - `plans/XXX-kebab-case-feature-name.md`
     - `tasks/XXX-kebab-case-feature-name.md`
     - `walkthroughs/XXX-kebab-case-feature-name.md`

---

## 2. Fase 1: Investigación y Creación del Plan (`plans/XXX-*.md`)

Antes de realizar cualquier cambio en el código fuente:
1. **Investigar el Codebase:**
   - Usar herramientas de lectura y búsqueda (`grep_search`, `find_by_name`, `view_file`) para diagnosticar la arquitectura existente en Backend (.NET) y Frontend (Angular).
2. **Estructura Obligatoria del Plan:**
   - **Título y Metadatos:** Número de plan, fecha, estado y enlace a las tareas asociadas.
   - **Requerimiento Original:** Cita textual de la solicitud y contexto del negocio.
   - **Hallazgos en el Código (Findings):** Estado actual del backend, entidades, controladores, servicios y frontend.
   - **Decisión Arquitectónica:** Comparativa de alternativas consideradas y justificación de la mejor decisión.
   - **Nuevas Ideas y Valor Agregado:** Aportes proactivos para escalabilidad, seguridad y UX.
   - **Especificación Técnica por Capas:** Backend (Dominio, EF Core, DTOs, Servicios, API) y Frontend (Modelos, Servicios/Signals, Guards, Componentes).
   - **Plan de Pruebas:** Pruebas automatizadas y casos de verificación manual.

---

## 3. Fase 2: Matriz de Tareas Accionables (`tasks/XXX-*.md`)

1. **Estructura Obligatoria de Tareas:**
   - **Metadatos y Enlace:** Referencia directa al plan correspondiente.
   - **Matriz de Progreso:** Contador general de avance `[0/N]` y contadores por fase.
   - **Desglose de Tareas (`TASK-XXX-YY`):**
     - Cada tarea debe tener descripción clara, archivos exactos a intervenir y criterio de aceptación verificable.
2. **Ciclo de Actualización en Vivo:**
   - A medida que se concluya cada tarea, actualizar el archivo en el repositorio marcando el checkbox correspondiente a `[x]`.

---

## 4. Fase 3: Ejecución y Validación

1. **Aprobación Previa:**
   - Presentar el plan y las tareas al usuario y esperar su confirmación antes de iniciar la codificación.
2. **Calidad y Verificación:**
   - Ejecutar pruebas automatizadas en backend: `dotnet test backend/MedApp.slnx`.
   - Ejecutar compilación de producción en frontend: `npx ng build` en `frontend/`.
   - Verificar que no existan errores ni regresiones.

---

## 5. Fase 4: Documento de Entrega (`walkthroughs/XXX-*.md`)

Al finalizar con éxito todas las tareas:
1. **Estructura Obligatoria del Walkthrough:**
   - **Resumen de la Entrega:** Qué problema se resolvió y el impacto en la solución.
   - **Matriz de Archivos:** Tabla detallada clasificando archivos Nuevos y Modificados por capa (Dominio, Infraestructura, Aplicación, API, Frontend Core, Vistas).
   - **Evidencias de Pruebas:**
     - Resultados de las pruebas unitarias y de integración del backend.
     - Confirmación de compilación exitosa del bundle de Angular.
     - Pasos para verificación funcional por parte del usuario.
