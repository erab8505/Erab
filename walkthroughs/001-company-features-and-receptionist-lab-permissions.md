# Walkthrough 001: Sistema de Características por Empresa y Permisos de Laboratorio para Recepcionistas

**Plan Asociado:** [`plans/001-company-features-and-receptionist-lab-permissions.md`](../plans/001-company-features-and-receptionist-lab-permissions.md)  
**Tareas Asociadas:** [`tasks/001-company-features-and-receptionist-lab-permissions.md`](../tasks/001-company-features-and-receptionist-lab-permissions.md)  
**Fecha de Implementación:** 2026-09-25  
**Estado:** Implementado y Verificado `[12/12 Tareas Superadas]`  
**Autor:** Antigravity / EraB Architecture Team  

---

## 1. Resumen de la Entrega

Se diseñó e implementó exitosamente el sistema de **características por empresa (Feature Flags / Company Features)** y los permisos granulares para el rol **Recepcionista** en órdenes de estudio de laboratorio.

### Objetivos Alcanzados:
1. **Multi-tenant Feature Flags:** Las empresas ahora poseen su propia configuración modular sin alterar la tabla principal `Companies`.
2. **Activación Modular de Pantallas y Rutas:** Módulos de *Agenda y Citas* (`MODULE_SCHEDULING`) y *Estudios y Laboratorio* (`MODULE_LABORATORY`) se activan o desactivan por empresa en Frontend y Backend.
3. **Emisión de Estudios en Recepción:** Recepcionistas pueden emitir órdenes de laboratorio desde mostrador únicamente si la empresa activa tiene habilitada la política `ALLOW_RECEPTIONIST_STUDY_ORDERS`.
4. **Panel SuperAdmin con Switches y Presets:** Formulario modal con toggles individuales e inicio rápido mediante plantillas (*Clínica Médica*, *Laboratorio Puro*, *Centro Integral*).

---

## 2. Componentes y Archivos Creados / Modificados

### Backend (.NET 8 Web API / EF Core)

| Componente | Archivo | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Dominio** | `MedApp.Domain/Entities/CompanyFeature.cs` | **[NUEVO]** | Entidad de persistencia de features por empresa. |
| **Dominio** | `MedApp.Domain/Constants/CompanyFeatureKeys.cs` | **[NUEVO]** | Constantes fuertemente tipadas de claves de características. |
| **Dominio** | `MedApp.Domain/Extensions/CompanyFeatureExtensions.cs` | **[NUEVO]** | Helpers para consultar features y convertir a diccionarios. |
| **Dominio** | `MedApp.Domain/Entities/Company.cs` | **[MODIFICADO]** | Colección de navegación `Features`. |
| **Infraestructura** | `MedApp.Infrastructure/Data/Configurations/CompanyFeatureConfiguration.cs` | **[NUEVO]** | Mapeo EF Core con índice único `(CompanyId, FeatureKey)` y cascada. |
| **Infraestructura** | `MedApp.Infrastructure/Data/MedAppDbContext.cs` | **[MODIFICADO]** | `DbSet<CompanyFeature>` y filtro multi-tenant global. |
| **Infraestructura** | `MedApp.Infrastructure/Data/Migrations/20260925162257_AddCompanyFeatures.cs` | **[NUEVO]** | Migración EF Core aplicada a la base de datos. |
| **Infraestructura** | `MedApp.Infrastructure/Data/DbInitializer.cs` | **[MODIFICADO]** | Método `SeedCompanyFeaturesAsync` para sembrado automático. |
| **Aplicación** | `MedApp.Application/DTOs/CompanyDtos.cs` | **[MODIFICADO]** | `Features` dictionary en `CompanyDto`, `CreateCompanyDto` y `UpdateCompanyDto`. |
| **Aplicación** | `MedApp.Application/Services/CompanyService.cs` | **[MODIFICADO]** | Sincronización y consulta de features en CRUD de empresas. |
| **Aplicación** | `MedApp.Application/Services/StudyOrderService.cs` | **[MODIFICADO]** | Validación en `CreateAsync` de `MODULE_LABORATORY` y `ALLOW_RECEPTIONIST_STUDY_ORDERS`. |
| **API** | `MedApp.Api/Controllers/StudyOrdersController.cs` | **[MODIFICADO]** | Inclusión de `Receptionist` en `POST /api/study-orders`. |
| **Tests** | `MedApp.Tests/CompanyFeaturesTests.cs` | **[NUEVO]** | Suite de pruebas de integración para features y permisos de recepcionista. |
| **Tests** | `MedApp.Tests/ClinicalAuthorizationTests.cs` | **[MODIFICADO]** | Validación de acciones restringidas para recepcionistas. |
| **Tests** | `MedApp.Tests/Infrastructure/CustomWebApplicationFactory.cs` | **[MODIFICADO]** | Seeding de empresas con diferentes combinaciones de features. |

### Frontend (Angular Standalone)

| Componente | Archivo | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| **Modelos** | `src/app/core/models/models.ts` | **[MODIFICADO]** | `CompanyFeatureKeys` y propiedades `features` en interfaces TypeScript. |
| **Servicios** | `src/app/core/services/company-context.service.ts` | **[MODIFICADO]** | Signals reactivos `hasScheduling`, `hasLaboratory`, `canReceptionistCreateStudies` y método `hasFeature`. |
| **Guards** | `src/app/core/guards/module.guard.ts` | **[NUEVO]** | Guard de Angular que protege rutas y notifica con Toast si el módulo no está activo. |
| **Rutas** | `src/app/app.routes.ts` | **[MODIFICADO]** | Protección de `/scheduling` y `/studies` con `moduleGuard`. |
| **Layout** | `src/app/layout/shell.component.ts` | **[MODIFICADO]** | Oculta/muestra items de Agenda y Laboratorio combinando rol + feature de la empresa activa. |
| **Pacientes** | `src/app/features/patients/components/patient-studies-tab.component.ts` | **[MODIFICADO]** | Control dinámico del botón "+ Solicitar Estudio" según `canCreateOrder()`. |
| **Estudios** | `src/app/features/studies/study-order-list.component.ts` | **[MODIFICADO]** | Control dinámico del botón "+ Nueva Orden de Estudio" según `canCreateStudyOrder()`. |
| **SuperAdmin** | `src/app/features/admin/companies/company-list.component.ts` | **[MODIFICADO]** | Insignias en tabla, toggles por categoría y presets rápidos en modal de empresa. |

---

## 3. Evidencias de Verificación y Calidad

### Pruebas Automatizadas de Backend
Ejecución: `dotnet test backend/MedApp.slnx`
```
Serie de pruebas para C:\Erab\backend\MedApp.Tests\bin\Debug\net10.0\MedApp.Tests.dll (.NETCoreApp,Version=v10.0)
Correctas! - Con error: 0, Superado: 29, Omitido: 0, Total: 29, Duración: 10 s
```
* **Escenarios verificados:**
  1. `GetAllCompanies_ReturnsFeaturesDictionary`: El backend serializa y devuelve el mapa completo de features.
  2. `Receptionist_InCompanyWithLabAndPermission_CanCreateStudyOrder`: Recepcionista en Empresa con Lab=ON y Política=ON emite orden (`201 Created`).
  3. `Receptionist_InCompanyWithoutLab_CannotCreateStudyOrder`: Recepcionista en Empresa con Lab=OFF recibe `400 BadRequest` con mensaje explicativo.
  4. `SuperAdmin_CanUpdateCompanyFeatures_AndTogglePermissions`: SuperAdmin apaga la política y el recepcionista queda inmediatamente bloqueado.
  5. `Receptionist_StudyOrderManagementActions_Returns403Forbidden`: Recepcionista no puede alterar estados de análisis ni capturar resultados.

### Compilación de Producción de Frontend
Ejecución: `npx ng build` en `frontend/`
```
Application bundle generation complete. [6.238 seconds]
0 Errores
```
Sin advertencias ni discrepancias de tipos en TypeScript.
