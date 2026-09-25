# Tareas 004: Visibilidad y Acceso Completo de Enlaces del Menú de Navegación para SuperAdmin

## Metadatos
- **ID:** 004-superadmin-navigation-menu-links
- **Plan de Referencia:** [plans/004-superadmin-navigation-menu-links.md](../plans/004-superadmin-navigation-menu-links.md)
- **Progreso:** [3/3] tareas completadas (100%)

---

## Matriz de Tareas

### Fase 1: Frontend - Navegación y Visibilidad
- [x] `TASK-004-01`: Habilitar visualización de todos los módulos para SuperAdmin en `ShellComponent`.
  - **Archivos:** `frontend/src/app/layout/shell.component.ts`
  - **Criterio de Aceptación:** SuperAdmin debe visualizar los enlaces de `Agenda y Citas`, `Estudios y Laboratorio`, `Catálogo de Estudios` y todos los enlaces administrativos aun si la empresa activa tiene el módulo deshabilitado.
- [x] `TASK-004-02`: Eximir a SuperAdmin de restricciones en `moduleGuard`.
  - **Archivos:** `frontend/src/app/core/guards/module.guard.ts`
  - **Criterio de Aceptación:** `moduleGuard` debe retornar `true` de inmediato si el usuario autenticado tiene el rol `SuperAdmin`.

### Fase 2: Validación y Entrega
- [x] `TASK-004-03`: Ejecutar suite de pruebas y generar entrega.
  - **Archivos:**
    - `walkthroughs/004-superadmin-navigation-menu-links.md`
  - **Criterio de Aceptación:** `dotnet test` y `npx ng build` sin errores, y documentación del walkthrough finalizada.
