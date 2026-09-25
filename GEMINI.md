# Reglas del Proyecto EraB

## 1. Ciclo de Vida Obligatorio de Características (Feature Lifecycle)
- Ante cualquier requerimiento, cambio de lógica, nueva funcionalidad o refactorización solicitada por el usuario, debes activar y seguir estrictamente la skill `versioned-feature-lifecycle`.
- **Prohibido modificar código fuente** sin haber generado previamente:
  1. El plan versionado en `plans/XXX-nombre-descriptivo.md`.
  2. Las tareas versionadas en `tasks/XXX-nombre-descriptivo.md`.
- El número de versión `XXX` debe ser secuencial de 3 dígitos (ej. `001`, `002`, `003`...), determinado inspeccionando la carpeta `plans/`.
- Durante la ejecución, debes mantener actualizado el progreso en `tasks/XXX-*.md` marcando con `[x]` las tareas completadas.
- Al finalizar, es obligatorio generar el documento de entrega en `walkthroughs/XXX-nombre-descriptivo.md` con la matriz de archivos afectados y evidencias de pruebas (`dotnet test`, `ng build`).

## 2. Estándares Técnicos
- **Backend:** C# / .NET 8 / EF Core con Clean Architecture (Domain, Infrastructure, Application, Api).
- **Frontend:** Angular Standalone components, Signals, Reactive Forms, Guards funcionales.
- **Calidad:** Antes de dar por concluida una tarea, siempre asegurar que la compilación y los tests automatizados pasen con 0 errores.
