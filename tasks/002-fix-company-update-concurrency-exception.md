# Tasks 002: Corrección de Excepción de Concurrencia en Actualización de Empresas (DbUpdateConcurrencyException)

**Plan Asociado:** [`plans/002-fix-company-update-concurrency-exception.md`](../plans/002-fix-company-update-concurrency-exception.md)  
**Fecha de Creación:** 2026-09-25  
**Estado:** Completado `[4/4]`  

---

## Matriz de Tareas

- [x] **TASK-002-01: Remover QueryFilter restrictivo de `CompanyFeature` en `MedAppDbContext`**
  - **Descripción**: Quitar el filtro global en `MedAppDbContext.cs` para evitar que las features de una empresa sean ocultadas cuando se consulta o actualiza una empresa distinta a la activa.
  - **Archivos**: `backend/MedApp.Infrastructure/Data/MedAppDbContext.cs`
  - **Criterio de Aceptación**: `CompanyFeatures` se cargan consistentemente al hacer `.Include(c => c.Features)`.

- [x] **TASK-002-02: Forzar `EntityState.Added` al insertar features en `CompanyService.UpdateCompanyAsync`**
  - **Descripción**: Usar `_context.CompanyFeatures.Add(...)` en lugar de únicamente `company.Features.Add(...)` para evitar que EF Core infiera `EntityState.Modified` debido al `Guid.NewGuid()` predeterminado en `BaseEntity`.
  - **Archivos**: `backend/MedApp.Application/Services/CompanyService.cs`
  - **Criterio de Aceptación**: La creación de nuevas features durante el update emite `INSERT` y no falla con `DbUpdateConcurrencyException`.

- [x] **TASK-002-03: Corregir `SeedCompanyFeaturesAsync` en `DbInitializer.cs`**
  - **Descripción**: Usar `context.CompanyFeatures.Add(...)` en el seeder para asegurar que la inicialización del sistema en arranque no falle en bases de datos relacionales reales.
  - **Archivos**: `backend/MedApp.Infrastructure/Data/DbInitializer.cs`
  - **Criterio de Aceptación**: El arranque del backend inicializa las features sin lanzar advertencias ni excepciones.

- [x] **TASK-002-04: Ejecutar y Verificar Pruebas Automatizadas**
  - **Descripción**: Correr la suite de pruebas completa con `dotnet test backend/MedApp.slnx` y verificar compilación de backend y frontend.
  - **Archivos**: `backend/MedApp.Tests/CompanyFeaturesTests.cs`
  - **Criterio de Aceptación**: 100% de pruebas pasando sin errores (29 superadas).
