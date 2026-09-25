# Walkthrough 002: Corrección de Excepción de Concurrencia en Actualización de Empresas (DbUpdateConcurrencyException)

**Plan Asociado:** [`plans/002-fix-company-update-concurrency-exception.md`](../plans/002-fix-company-update-concurrency-exception.md)  
**Tareas Asociadas:** [`tasks/002-fix-company-update-concurrency-exception.md`](../tasks/002-fix-company-update-concurrency-exception.md)  
**Fecha de Implementación:** 2026-09-25  
**Estado:** Resuelto y Verificado `[4/4 Tareas Superadas]`  
**Autor:** Antigravity / EraB Architecture Team  

---

## 1. Causa Raíz Identificada

El error reportado:
```
Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException: The database operation was expected to affect 1 row(s), but actually affected 0 row(s); data may have been modified or deleted since entities were loaded.
```

Ocurría debido a dos factores en Entity Framework Core y SQL Server:
1. **Detección de estado con `Guid.NewGuid()` predeterminado:**
   * La entidad `CompanyFeature` hereda de `BaseEntity`, la cual inicializa `Id = Guid.NewGuid()`.
   * Al agregar nuevas características a una empresa existente que ya está rastreada en el ChangeTracker (`company.Features.Add(...)`), EF Core inspecciona la clave primaria. Como `feature.Id` no es el valor por defecto de CLR (`Guid.Empty`), EF Core asume que la entidad ya existía en la base de datos y le asigna el estado `EntityState.Modified` en vez de `EntityState.Added`.
   * Esto provocaba que EF Core enviara un `UPDATE [CompanyFeatures] ... WHERE [Id] = @p` en lugar de un `INSERT`. Al no existir dicho Id en la base de datos, SQL Server retornaba `0 rows affected`, disparando la excepción de concurrencia optimista.
2. **QueryFilter restrictivo en `CompanyFeature`:**
   * El filtro global multi-tenant configurado en `MedAppDbContext` ocultaba las características de cualquier empresa que no coincidiera con el `_companyContext.CompanyId` de la sesión actual, provocando que al editar otra empresa pareciera que no tenía características configuradas.

---

## 2. Solución Aplicada

1. **Eliminación del QueryFilter en `CompanyFeature`:**
   * En [`MedAppDbContext.cs`](file:///c:/Erab/backend/MedApp.Infrastructure/Data/MedAppDbContext.cs), se removió el filtro global en `CompanyFeature`. Las características son metadatos de configuración de la empresa (igual que `Name` o `TaxId`) y deben estar siempre disponibles para su administración global.
2. **Invocación Explícita de `_context.CompanyFeatures.Add(...)`:**
   * En [`CompanyService.cs`](file:///c:/Erab/backend/MedApp.Application/Services/CompanyService.cs), al detectar una nueva característica no existente en `company.Features`, se llama explícitamente a `_context.CompanyFeatures.Add(newFeature)`. Esto fuerza a EF Core a registrar la entidad con `EntityState.Added`, asegurando la emisión de `INSERT INTO [CompanyFeatures]`.
3. **Corrección en el Seeder de Inicialización:**
   * En [`DbInitializer.cs`](file:///c:/Erab/backend/MedApp.Infrastructure/Data/DbInitializer.cs), el método `SeedCompanyFeaturesAsync` ahora usa `context.CompanyFeatures.Add(...)`. Se verificó el arranque en vivo contra SQL Server LocalDB y completó la sincronización (`MERGE/INSERT`) con 0 excepciones.

---

## 3. Matriz de Archivos Afectados

| Componente | Archivo | Modificación |
| :--- | :--- | :--- |
| **Infraestructura** | `backend/MedApp.Infrastructure/Data/MedAppDbContext.cs` | Removido el filtro multi-tenant en `CompanyFeature`. |
| **Infraestructura** | `backend/MedApp.Infrastructure/Data/DbInitializer.cs` | Registro explícito con `context.CompanyFeatures.Add` para forzar `EntityState.Added`. |
| **Aplicación** | `backend/MedApp.Application/Services/CompanyService.cs` | Registro explícito con `_context.CompanyFeatures.Add` al insertar nuevas features en `UpdateCompanyAsync`. |

---

## 4. Evidencias de Validación

1. **Arranque en Base de Datos Real SQL Server (`task-406.log`):**
   ```sql
   MERGE [CompanyFeatures] USING ...
   WHEN NOT MATCHED THEN
   INSERT ([Id], [CompanyId], [ConfigValue], [CreatedAt], [FeatureKey], [UpdatedAt])
   VALUES (...)
   info: Program[0] Company features seeded successfully for all existing companies.
   Now listening on: http://localhost:5178
   ```
2. **Pruebas Automatizadas de Backend:**
   Ejecución de `dotnet test backend/MedApp.slnx`:
   ```
   Correctas! - Con error: 0, Superado: 29, Omitido: 0, Total: 29, Duración: 8 s
   ```
   Todas las pruebas de creación, actualización y filtrado de features pasaron al 100%.
