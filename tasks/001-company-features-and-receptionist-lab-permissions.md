# Tasks 001: Sistema de Características por Empresa y Permisos de Laboratorio para Recepcionistas

**Plan Asociado:** [`plans/001-company-features-and-receptionist-lab-permissions.md`](../plans/001-company-features-and-receptionist-lab-permissions.md)  
**Fecha de Creación:** 2026-09-25  
**Estado:** Completado `[12/12]`  

---

## 1. Contexto del Requerimiento y Objetivo

> **Definición de Necesidad:**
> * Habilitar o deshabilitar módulos por empresa (`MODULE_SCHEDULING`, `MODULE_LABORATORY`) mediante un sistema modular de Feature Flags por Empresa (`CompanyFeatures`).
> * Permitir configurar a nivel de empresa si el rol `Receptionist` puede o no crear órdenes de laboratorio (`ALLOW_RECEPTIONIST_STUDY_ORDERS`).
> * Adaptar navegación (Sidebar), Guards de ruta en Angular, DTOs, API REST y pantalla de administración en SuperAdmin con switches/presets.

---

## 2. Matriz de Progreso de Tareas

- [x] **Fase 1: Dominio y Persistencia (Backend)** `[3/3]`
- [x] **Fase 2: Capa de Aplicación y Lógica de Negocio (Backend)** `[3/3]`
- [x] **Fase 3: API REST y Controladores (Backend)** `[2/2]`
- [x] **Fase 4: Modelos, Contexto y Guards (Frontend)** `[2/2]`
- [x] **Fase 5: Vistas, Menús y Panel SuperAdmin (Frontend)** `[2/2]`

---

## 3. Detalle de Tareas por Fase

### Fase 1: Dominio y Persistencia (Backend)

- [x] **TASK-001-01: Crear Entidad `CompanyFeature` y Constantes de Claves**
  - **Descripción**: Crear la entidad `CompanyFeature` (`Id`, `CompanyId`, `FeatureKey`, `IsEnabled`, `ConfigValue`, `CreatedAt`, `UpdatedAt`) y la clase estática `CompanyFeatureKeys` con constantes (`MODULE_SCHEDULING`, `MODULE_LABORATORY`, `ALLOW_RECEPTIONIST_STUDY_ORDERS`).
  - **Archivos**:
    - `backend/MedApp.Domain/Entities/CompanyFeature.cs`
    - `backend/MedApp.Domain/Constants/CompanyFeatureKeys.cs`
    - `backend/MedApp.Domain/Entities/Company.cs` (Colección `Features`).
  - **Criterio de Aceptación**: Entidad de dominio compilando limpiamente con tipos fuertemente tipados.

- [x] **TASK-001-02: Configurar Entity Framework Core en `MedAppDbContext`**
  - **Descripción**: Agregar `DbSet<CompanyFeature>`, configurar clave foránea hacia `Company`, índice único compuesto en `(CompanyId, FeatureKey)` y Multi-tenant Global Query Filter si aplica.
  - **Archivos**:
    - `backend/MedApp.Infrastructure/Data/MedAppDbContext.cs`
    - `backend/MedApp.Infrastructure/Data/Configurations/CompanyFeatureConfiguration.cs`
  - **Criterio de Aceptación**: Modelo de BD configurado con índice único para evitar duplicidad de features por empresa.

- [x] **TASK-001-03: Crear y Aplicar Migración de Base de Datos**
  - **Descripción**: Generar la migración EF Core (`AddCompanyFeatures`) y actualizar `DbInitializer` para sembrar los features por defecto para empresas existentes (`MODULE_SCHEDULING = true`, `MODULE_LABORATORY = true`, `ALLOW_RECEPTIONIST_STUDY_ORDERS = true` para la empresa demo).
  - **Archivos**:
    - `backend/MedApp.Infrastructure/Data/Migrations/20260925162257_AddCompanyFeatures.cs`
    - `backend/MedApp.Infrastructure/Data/DbInitializer.cs`
  - **Criterio de Aceptación**: Migración aplicada sin errores y datos existentes preservados.

---

### Fase 2: Capa de Aplicación y Lógica de Negocio (Backend)

- [x] **TASK-001-04: Actualizar DTOs de Empresa y Extensiones**
  - **Descripción**: Extender `CompanyDto`, `CreateCompanyDto` y `UpdateCompanyDto` con `Dictionary<string, bool> Features`. Crear métodos de extensión sobre `Company` (`HasFeature(string key)`, `ToFeaturesDictionary()`).
  - **Archivos**:
    - `backend/MedApp.Application/DTOs/CompanyDtos.cs`
    - `backend/MedApp.Domain/Extensions/CompanyFeatureExtensions.cs`
  - **Criterio de Aceptación**: DTOs transmiten el mapa de características activo/inactivo.

- [x] **TASK-001-05: Actualizar `CompanyService` para Gestión de Features**
  - **Descripción**: Modificar creación y edición de empresas en `CompanyService` para guardar y sincronizar los registros de `CompanyFeatures`. Incluir las features en las consultas `GetByIdAsync`, `GetAllAsync`, `GetMyCompaniesAsync`.
  - **Archivos**:
    - `backend/MedApp.Application/Services/CompanyService.cs`
  - **Criterio de Aceptación**: SuperAdmin puede guardar y consultar los estados de features de cada empresa.

- [x] **TASK-001-06: Aplicar Reglas de Validación en `StudyOrderService`**
  - **Descripción**: Validar en `StudyOrderService.CreateAsync`:
    1. Que la empresa activa tenga `MODULE_LABORATORY == true`.
    2. Si el usuario actual tiene rol `Receptionist`, validar que la empresa tenga `ALLOW_RECEPTIONIST_STUDY_ORDERS == true`. Si no, retornar error explicativo.
  - **Archivos**:
    - `backend/MedApp.Application/Services/StudyOrderService.cs`
  - **Criterio de Aceptación**: Recepcionista puede crear órdenes únicamente si la política de la empresa lo autoriza.

---

### Fase 3: API REST y Controladores (Backend)

- [x] **TASK-001-07: Actualizar Autorización en `StudyOrdersController`**
  - **Descripción**: Ajustar `[Authorize(Roles = "...")]` en `StudyOrdersController.Create` para permitir al rol `Receptionist` llegar a la capa de servicio (donde se aplica la regla de feature flag de empresa).
  - **Archivos**:
    - `backend/MedApp.Api/Controllers/StudyOrdersController.cs`
  - **Criterio de Aceptación**: Petición de recepcionista no es rechazada prematuramente con 401/403 a nivel de ruta.

- [x] **TASK-001-08: Tests Unitarios y de Integración (Backend)**
  - **Descripción**: Crear pruebas unitarias en `MedApp.Tests` para `CompanyService` y `StudyOrderService` cubriendo los diferentes escenarios de feature flags y permisos de recepcionista.
  - **Archivos**:
    - `backend/MedApp.Tests/CompanyFeaturesTests.cs`
    - `backend/MedApp.Tests/ClinicalAuthorizationTests.cs`
  - **Criterio de Aceptación**: Ejecución de `dotnet test` pasa con 100% de éxito (29 tests superados).

---

### Fase 4: Modelos, Contexto y Guards (Frontend)

- [x] **TASK-001-09: Actualizar Modelos e Interfaces TypeScript**
  - **Descripción**: Actualizar `CompanyDto`, `CreateCompanyDto`, `UpdateCompanyDto` en `models.ts` con `features?: Record<string, boolean>`. Definir constantes de features `CompanyFeatureKeys`.
  - **Archivos**:
    - `frontend/src/app/core/models/models.ts`
  - **Criterio de Aceptación**: TypeScript compila sin discrepancias de tipos.

- [x] **TASK-001-10: Implementar Signals en `CompanyContextService` y `moduleGuard`**
  - **Descripción**:
    1. En `CompanyContextService`: método `hasFeature(key: string)` y signals computados `hasScheduling`, `hasLaboratory`, `canReceptionistCreateStudies`.
    2. Crear `moduleGuard(featureKey: string)` y proteger `/scheduling` y `/studies` en `app.routes.ts`.
  - **Archivos**:
    - `frontend/src/app/core/services/company-context.service.ts`
    - `frontend/src/app/core/guards/module.guard.ts`
    - `frontend/src/app/app.routes.ts`
  - **Criterio de Aceptación**: Navegación directa por URL a un módulo inactivo redirige de inmediato a `/dashboard`.

---

### Fase 5: Vistas, Menús y Panel SuperAdmin (Frontend)

- [x] **TASK-001-11: Adaptar Sidebar (`shell.component.ts`) y Ficha de Paciente**
  - **Descripción**:
    1. En `shell.component.ts`: mostrar "Agenda y Citas" y "Estudios y Laboratorio" combinando rol + módulo activo de la empresa.
    2. En `patient-studies-tab.component.ts` y `study-order-list.component.ts`: mostrar el botón "Nueva Orden" a recepcionistas solo si `companyContext.canReceptionistCreateStudies()` es `true`.
  - **Archivos**:
    - `frontend/src/app/layout/shell.component.ts`
    - `frontend/src/app/features/patients/components/patient-studies-tab.component.ts`
    - `frontend/src/app/features/studies/study-order-list.component.ts`
  - **Criterio de Aceptación**: La UI se adapta dinámicamente según la empresa activa seleccionada.

- [x] **TASK-001-12: Switches y Presets de Features en Gestión de Empresas (SuperAdmin)**
  - **Descripción**: En `company-list.component.ts`, agregar sección visual de toggles por categoría (*Módulos Principales* y *Políticas Operativas*) y botones de presets (*Clínica Estándar*, *Laboratorio Puro*, *Centro Integral*) en el modal de crear/editar empresa. Mostrar insignias de módulos en la tabla.
  - **Archivos**:
    - `frontend/src/app/features/admin/companies/company-list.component.ts`
  - **Criterio de Aceptación**: SuperAdmin puede activar/desactivar cada feature y guardar con efecto inmediato.
