# Plan 002: Corrección de Excepción de Concurrencia en Actualización de Empresas (DbUpdateConcurrencyException)

**Fecha:** 2026-09-25  
**Estado:** Propuesto / En Ejecución  
**Autor:** Antigravity / EraB Architecture Team  
**Tareas Asociadas:** [`tasks/002-fix-company-update-concurrency-exception.md`](../tasks/002-fix-company-update-concurrency-exception.md)

---

## 1. Requerimiento Original y Reporte del Error

> **Error Reportado por el Usuario:**
> ```
> fail: MedApp.Api.Middleware.GlobalExceptionHandlerMiddleware[0]
>       An unhandled exception occurred during request execution: The database operation was expected to affect 1 row(s), but actually affected 0 row(s); data may have been modified or deleted since entities were loaded. See https://go.microsoft.com/fwlink/?LinkId=527962 for information on understanding and handling optimistic concurrency exceptions.
>       Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException: The database operation was expected to affect 1 row(s), but actually affected 0 row(s); data may have been modified or deleted since entities were loaded.
> ```

---

## 2. Hallazgos en el Código (Root Cause Analysis - Findings)

Al inspeccionar los logs de SQL generados por EF Core en `(localdb)\mssqllocaldb` (`MedAppDb`), se descubrió la causa raíz exacta:

1. **Inferencia de Estado en EF Core con Claves pre-asignadas (`Guid.NewGuid()`):**
   * En `BaseEntity.cs`, la propiedad `Id` se inicializa por defecto como `public Guid Id { get; set; } = Guid.NewGuid();`.
   * En `CompanyService.UpdateCompanyAsync` y `DbInitializer.SeedCompanyFeaturesAsync`, al agregar una nueva característica a una empresa existente que ya está siendo rastreada en el ChangeTracker (`company.Features.Add(new CompanyFeature { ... })`), EF Core detecta la entidad a través de la navegación.
   * Como `feature.Id` ya contiene un Guid no nulo (`!= Guid.Empty`), el mecanismo de detección de cambios de EF Core asume erróneamente que la entidad **ya existe** en la base de datos y le asigna el estado `EntityState.Modified` en lugar de `EntityState.Added`.
   * Al invocar `SaveChangesAsync()`, EF Core emite un comando SQL `UPDATE [CompanyFeatures] ... WHERE [Id] = @p...` en lugar de un `INSERT INTO [CompanyFeatures]`.
   * Como el registro nunca fue insertado, SQL Server reporta `0 rows affected`. EF Core detecta que esperaba afectar 1 fila pero afectó 0 y lanza `DbUpdateConcurrencyException`.

2. **QueryFilter Inadecuado en `CompanyFeature`:**
   * En `MedAppDbContext.cs`, se configuró un `HasQueryFilter` en `CompanyFeature` dependiente de `_companyContext.CompanyId`.
   * La entidad `Company` no tiene QueryFilter porque los administradores gestionan múltiples empresas. Al tener `CompanyFeature` filtrado por la empresa activa en sesión, cuando un usuario intenta editar una empresa distinta a la activa, sus características son filtradas (retornando lista vacía), provocando intentos de re-inserción duplicada o inconsistencias de rastreo.

---

## 3. Decisión Técnica y Solución

1. **Uso Explícito de `_context.CompanyFeatures.Add(...)`:**
   * Al agregar una nueva característica, agregarse explícitamente a través del `DbSet` (`_context.CompanyFeatures.Add(newFeature)`). Esto fuerza a EF Core a marcar la entidad como `EntityState.Added`, garantizando que se genere `INSERT INTO [CompanyFeatures]`.
2. **Eliminación del QueryFilter en `CompanyFeature`:**
   * `CompanyFeature` es un atributo de configuración intrínseco de `Company` (al igual que su `Name` o `TaxId`). No debe ocultarse según la sesión del usuario cuando se consultan o actualizan empresas. Las validaciones de acceso por tenant se realizan a nivel de servicio (`StudyOrderService`).
3. **Manejo Seguro en `DbInitializer.cs`:**
   * Sincronizar las características usando `context.CompanyFeatures.Add(...)` para evitar que la inicialización en arranque lance concurrencia.

---

## 4. Especificación de Cambios

### Backend
1. **[`MedApp.Infrastructure/Data/MedAppDbContext.cs`](file:///c:/Erab/backend/MedApp.Infrastructure/Data/MedAppDbContext.cs):**
   * Remover `modelBuilder.Entity<CompanyFeature>().HasQueryFilter(...)`.
2. **[`MedApp.Application/Services/CompanyService.cs`](file:///c:/Erab/backend/MedApp.Application/Services/CompanyService.cs):**
   * En `UpdateCompanyAsync`, si la característica no existe en `company.Features`, llamar a `_context.CompanyFeatures.Add(...)` explícitamente.
3. **[`MedApp.Infrastructure/Data/DbInitializer.cs`](file:///c:/Erab/backend/MedApp.Infrastructure/Data/DbInitializer.cs):**
   * En `SeedCompanyFeaturesAsync`, llamar a `context.CompanyFeatures.Add(...)` explícitamente.
4. **[`MedApp.Tests/CompanyFeaturesTests.cs`](file:///c:/Erab/backend/MedApp.Tests/CompanyFeaturesTests.cs):**
   * Añadir test que valide la actualización de features tanto cuando ya existen como cuando se añaden nuevas claves a una empresa existente sin que ocurra excepción de concurrencia.
