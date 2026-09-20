# MedApp Implementation Plan & Architecture Specification

This plan is based on a technical review of `rebuild-guide.html`, `functional-tasks-and-acceptance.html`, and `functionalities.html`. It incorporates **Angular 22** (the latest stable release) modern best coding standards, clean architecture principles for ASP.NET Core (.NET 8/10), **Microsoft SQL Server (MSSQL)** as the primary enterprise database, strict server-side multi-tenancy, and end-to-end acceptance validation criteria.

---

## 1. Technology Stack & Framework Standards

### 1.1 Frontend: Modern Angular (Angular 22 LTS / Current)
- **Framework & CLI**: Angular 22.x with TypeScript 5.x and standalone architecture by default (no `@NgModule`).
- **State & Reactivity**:
  - Native Signals (`signal()`, `computed()`, `linkedSignal()`, `resource()`, `effect()`) for reactive state management.
  - Signal-based component APIs: `input<T>()`, `input.required<T>()`, `output<T>()`, `model<T>()`, `viewChild()`, `contentChild()`.
  - Signal-interop with RxJS via `toSignal()` / `toObservable()` when bridging asynchronous event streams.
- **Template Engine & Control Flow**:
  - Native control flow: `@if`, `@else if`, `@else`, `@for (item of items; track item.id)`, `@switch`, `@case`, `@default`, and `@empty`.
  - Deferrable Views: `@defer (on viewport; prefetch on idle) { ... } @placeholder { ... } @loading { ... } @error { ... }` for performance-heavy modals, charts, and print views.
- **Dependency Injection**:
  - Modern `inject()` function everywhere instead of constructor parameter injection.
- **Routing & Navigation**:
  - Standalone routing with `provideRouter(routes, withComponentInputBinding(), withViewTransitions())`.
  - Functional guards (`CanActivateFn`, `CanDeactivateFn`) using `inject()`.
  - Lazy-loaded routes via `loadComponent` and `loadChildren`.
- **HTTP & Networking**:
  - `provideHttpClient(withInterceptors([authAndTenantInterceptor, errorInterceptor]), withFetch())`.
  - Functional HTTP interceptors (`HttpInterceptorFn`).
- **Forms**:
  - Strongly typed Reactive Forms with `NonNullableFormBuilder` / `inject(FormBuilder)`.
- **Performance & Change Detection**:
  - `ChangeDetectionStrategy.OnPush` on all components (Zoneless-ready signal reactivity).
  - Strict CSS budgeting (<4kB component styles) and modern native CSS nesting / CSS custom variables.

### 1.2 Backend: ASP.NET Core Clean Architecture (.NET 8/10) with Microsoft SQL Server
- **API Framework**: ASP.NET Core Web API, Minimal API / Controllers with RESTful conventions.
- **Database Engine**: Microsoft SQL Server (MSSQL) using Entity Framework Core (`Microsoft.EntityFrameworkCore.SqlServer`).
- **Data Types & Conventions**:
  - Primary Keys: `uniqueidentifier` (`Guid`).
  - Text fields: `nvarchar(n)` / `nvarchar(max)`.
  - Decimals (vitals, weights): `decimal(5,2)` / `decimal(18,2)`.
  - Dates & Instants: `datetimeoffset` stored in UTC.
  - Concurrency: `byte[]` RowVersion / concurrency tokens.
- **Authentication & Security**: BCrypt password hashing, JWT Bearer authentication, request-scoped `ICompanyContext`, custom authorization policies.
- **Validation**: FluentValidation with automatic pipeline validation filters.
- **Object Mapping**: Modern high-performance / source-generated mappings (or secure AutoMapper release).
- **Documentation & Quality**: OpenAPI / Swagger with JWT & `X-Company-Id` header security schemes, automated health checks (`/health`, `/health/db` checking MSSQL connectivity).

```
+-----------------------------------------------------------------------------------------+
|                                    Angular 22 Client                                    |
|   - Standalone Components (OnPush)               - Signal State (signal, computed, rx)  |
|   - Native Control Flow (@if, @for, @defer)      - Functional Guards & Interceptors     |
|   - Typed Reactive Forms                         - Accessible UI & Print Stylesheets    |
+-----------------------------------------------------------------------------------------+
                                             |
                   HTTPS / JSON (Bearer JWT + X-Company-Id Header)
                                             v
+-----------------------------------------------------------------------------------------+
|                                 ASP.NET Core Web API                                    |
|  +-----------------------------------------------------------------------------------+  |
|  | Api Layer: Controllers, Tenant Resolution Middleware, Global Exception Handler    |  |
|  +-----------------------------------------------------------------------------------+  |
|  | Application Layer: Use Case Services, DTOs, FluentValidation, Business Logic      |  |
|  +-----------------------------------------------------------------------------------+  |
|  | Domain Layer: Core Entities, Value Objects, Domain Enums, Exceptions              |  |
|  +-----------------------------------------------------------------------------------+  |
|  | Infrastructure Layer: EF Core MSSQL DbContext, Migrations, BCrypt, JWT Service   |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                             |
                                  SQL Server Protocol (T-SQL)
                                             v
+-----------------------------------------------------------------------------------------+
|                                Microsoft SQL Server (MSSQL)                             |
|  - Relational Schema with Unique Constraints & Filtered Indexes                         |
|  - ACID Transactions & Concurrency Locks                                                |
|  - Foreign Key Referential Integrity (Delete: Restrict / Cascade)                       |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Security, Tenancy & Hardening Directives

1. **Enforced Server-Side Multi-Tenancy (`ICompanyContext`)**:
   - `TenantResolutionMiddleware` extracts `X-Company-Id` from every incoming tenant-scoped request, verifies that the authenticated user has membership in that company, and registers a scoped `ICompanyContext`.
   - If `X-Company-Id` is missing, invalid, or unauthorized for the user, return `403 Forbidden` / `400 Bad Request`.
   - **Never trust request body `CompanyId`**: All entity creations automatically bind `CompanyId` from `ICompanyContext.CompanyId`.
   - **Cross-Entity Integrity**: All mutations and queries verify that foreign keys (`AreaId`, `SpecialtyId`, `SpecialistId`, `InterventionTypeId`, `PatientId`) belong to the active `CompanyId`.
2. **Clinical Endpoints Authorization**:
   - Medical Records (`/medical-records`) and Prescriptions (`/prescriptions`) must require `Admin` or `Specialist` role.
   - For `Specialist`, enforce server-side ownership: the specialist profile must match the user's `SpecialistId` and the appointment/patient context.
   - Receptionists are strictly forbidden from clinical endpoints (`403 Forbidden`).
3. **Database Migration Pipeline (MSSQL)**:
   - Use EF Core migrations targeting SQL Server with `Database.MigrateAsync()` during application deployment/startup. Never use `EnsureCreatedAsync()`.
4. **Appointment Overlap & Concurrency Protection**:
   - Enforce non-overlapping intervals:
     $$\text{existing.Start} < \text{requested.End} \quad\land\quad \text{requested.Start} < \text{existing.End}$$
   - Dynamic 30-minute slot generation computed as:
     $$\text{AvailableSlots} = \text{SpecialistAvailability}(day) \setminus \text{BookedIntervals}(day)$$
   - MSSQL isolation levels / transactions prevent race conditions during simultaneous booking attempts.
5. **Frontend Security & Hygiene**:
   - JWT stored in `sessionStorage` (mitigating persistent token theft across browser restarts).
   - Sanitized HTML output, strict CSP headers, and zero plain passwords in client state or logs.

---

## 3. Database Schema & Data Models (MSSQL Specification)

All primary keys use `uniqueidentifier` (`Guid`). All core entities inherit from `BaseEntity` (`Id`, `CreatedAt` in UTC, `UpdatedAt` in UTC).

| Table | Columns & SQL Types | Key Constraints & Indexes |
| :--- | :--- | :--- |
| **`Companies`** | `Id` (uniqueidentifier), `Name` (nvarchar(200)), `TaxId` (nvarchar(50)), `Address` (nvarchar(500)), `Phone` (nvarchar(30)), `Email` (nvarchar(200)), `IsActive` (bit), `Description` (nvarchar(max)) | PK: `Id`, Unique Index: `TaxId` WHERE `TaxId IS NOT NULL` |
| **`Users`** | `Id` (uniqueidentifier), `Username` (nvarchar(100)), `PasswordHash` (nvarchar(max)), `Role` (nvarchar(50)), `SpecialistId` (uniqueidentifier, nullable) | PK: `Id`, Unique: `Username`, FK: `SpecialistId -> Specialists.Id` |
| **`UserCompanies`** | `UserId` (uniqueidentifier), `CompanyId` (uniqueidentifier) | Composite PK: `(UserId, CompanyId)`, FKs to `Users` & `Companies` |
| **`Areas`** | `Id` (uniqueidentifier), `CompanyId` (uniqueidentifier), `Name` (nvarchar(200)), `Description` (nvarchar(max)) | PK: `Id`, FK: `CompanyId`, Delete: Restrict |
| **`Specialties`** | `Id` (uniqueidentifier), `AreaId` (uniqueidentifier), `CompanyId` (uniqueidentifier), `Name` (nvarchar(200)), `Description` (nvarchar(max)) | PK: `Id`, FK: `AreaId`, FK: `CompanyId` |
| **`Specialists`** | `Id` (uniqueidentifier), `SpecialtyId` (uniqueidentifier), `CompanyId` (uniqueidentifier), `FirstName` (nvarchar(100)), `LastName` (nvarchar(100)), `LicenseNumber` (nvarchar(100)), `Email` (nvarchar(200)), `Phone` (nvarchar(30)), `IsActive` (bit) | PK: `Id`, FK: `SpecialtyId`, FK: `CompanyId`, Unique Index: `(CompanyId, LicenseNumber)` |
| **`SpecialistAvailabilities`** | `Id` (uniqueidentifier), `SpecialistId` (uniqueidentifier), `DayOfWeek` (int, 0-6), `StartHour` (nvarchar(5)), `EndHour` (nvarchar(5)) | PK: `Id`, FK: `SpecialistId`, Check: `StartHour < EndHour` |
| **`InterventionTypes`** | `Id` (uniqueidentifier), `SpecialtyId` (uniqueidentifier), `CompanyId` (uniqueidentifier), `Name` (nvarchar(200)), `Code` (nvarchar(50)), `Description` (nvarchar(max)), `DurationMinutes` (int), `RequiresAnesthesia` (bit), `RequiresHospitalization` (bit), `IsActive` (bit) | PK: `Id`, FK: `SpecialtyId`, FK: `CompanyId`, Unique Index: `(CompanyId, Code)` WHERE `Code IS NOT NULL` |
| **`Patients`** | `Id` (uniqueidentifier), `CompanyId` (uniqueidentifier), `FirstName` (nvarchar(100)), `LastName` (nvarchar(100)), `BirthDate` (date), `Gender` (nvarchar(1)), `DocumentId` (nvarchar(50)), `Email` (nvarchar(200)), `Phone` (nvarchar(30)), `BloodType` (nvarchar(20)), `Allergies` (nvarchar(max)) | PK: `Id`, FK: `CompanyId`, Unique Index: `(CompanyId, DocumentId)` |
| **`Schedulings`** | `Id` (uniqueidentifier), `CompanyId` (uniqueidentifier), `PatientId` (uniqueidentifier), `SpecialistId` (uniqueidentifier), `InterventionTypeId` (uniqueidentifier), `ScheduledAt` (datetimeoffset), `DurationMinutes` (int), `Notes` (nvarchar(1000)), `Status` (nvarchar(50)) | PK: `Id`, FKs to `Company`, `Patient`, `Specialist`, `InterventionType` (Delete: Restrict). Index on `(SpecialistId, ScheduledAt)` |
| **`MedicalRecords`** | `Id` (uniqueidentifier), `CompanyId` (uniqueidentifier), `PatientId` (uniqueidentifier), `InterventionTypeId` (uniqueidentifier, nullable), `RecordDate` (datetimeoffset), `Diagnosis` (nvarchar(2000)), `Treatment` (nvarchar(max)), `Notes` (nvarchar(max)), `WeightKg` (decimal(5,2)?), `HeightCm` (decimal(5,2)?), `TemperatureCelsius` (decimal(4,1)?), `SystolicBP` (int?), `DiastolicBP` (int?), `HeartRateBpm` (int?), `OxygenSaturation` (int?) | PK: `Id`, FK: `CompanyId`, FK: `PatientId`, FK: `InterventionTypeId` |
| **`Prescriptions`** | `Id` (uniqueidentifier), `CompanyId` (uniqueidentifier), `PatientId` (uniqueidentifier), `MedicalRecordId` (uniqueidentifier, nullable), `SpecialistId` (uniqueidentifier), `PrescriptionDate` (datetimeoffset), `Notes` (nvarchar(2000)) | PK: `Id`, FKs: `CompanyId`, `PatientId`, `MedicalRecordId`, `SpecialistId` |
| **`PrescriptionItems`** | `Id` (uniqueidentifier), `PrescriptionId` (uniqueidentifier), `MedicationName` (nvarchar(200)), `Dosage` (nvarchar(100)), `Frequency` (nvarchar(100)), `DurationDays` (int), `Instructions` (nvarchar(500)) | PK: `Id`, FK: `PrescriptionId` (Cascade Delete in MSSQL), Check: `DurationDays > 0` |

---

## 4. API Endpoints & Role Permissions

Envelope format: `{ "success": boolean, "message": string, "data": T, "errors": string[] }`

| Route | Method | Access | Tenant Header | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | Anonymous | Optional | Authenticate user, return JWT & allowed companies |
| `/health`, `/health/db` | `GET` | Anonymous | No | System & MSSQL database health probe |
| `/companies/mine` | `GET` | Authenticated | No | Get user's assigned company list |
| `/companies` | `GET`, `POST` | Admin | No | List all companies, create new company |
| `/companies/{id}` | `GET`, `PUT`, `DELETE` | Admin | No | Company CRUD |
| `/areas` | `GET`, `POST` | Auth (Read), Admin (Write) | Required | Company areas |
| `/areas/{id}` | `GET`, `PUT`, `DELETE` | Auth (Read), Admin (Write) | Required | Area CRUD |
| `/specialties` | `GET`, `POST` | Auth (Read), Admin (Write) | Required | Company specialties under areas |
| `/specialties/{id}` | `GET`, `PUT`, `DELETE` | Auth (Read), Admin (Write) | Required | Specialty CRUD |
| `/intervention-types` | `GET`, `POST` | Auth (Read), Admin (Write) | Required | Procedure catalogue |
| `/intervention-types/{id}` | `GET`, `PUT`, `DELETE` | Auth (Read), Admin (Write) | Required | Procedure CRUD |
| `/specialists` | `GET`, `POST` | Auth (Read), Admin (Write) | Required | Specialist staff |
| `/specialists/{id}` | `GET`, `PUT`, `DELETE` | Auth (Read), Admin (Write) | Required | Specialist CRUD |
| `/specialists/{id}/availability` | `GET` | Authenticated | Required | Specialist weekly availability schedule |
| `/specialist-availability` | `POST` | Admin / Specialist (Self) | Required | Add availability time window |
| `/specialist-availability/{id}` | `DELETE` | Admin / Specialist (Self) | Required | Remove availability time window |
| `/specialists/{id}/slots?date=YYYY-MM-DD` | `GET` | Authenticated | Required | Dynamic available 30-min slots |
| `/users` | `GET`, `POST` | Admin | No | List/create user accounts |
| `/users/{id}` | `GET`, `PUT`, `DELETE` | Admin | No | User CRUD & company membership |
| `/patients` | `GET`, `POST` | Admin, Receptionist, Specialist | Required | Search/register patients |
| `/patients/{id}` | `GET`, `PUT`, `DELETE` | Auth (R/U), Admin (Del) | Required | Patient profile and details |
| `/scheduling` | `GET`, `POST` | Admin, Receptionist, Specialist | Required | List/book appointments |
| `/scheduling/{id}/status` | `PATCH` | Admin, Receptionist, Specialist | Required | Status transitions (`Scheduled` -> `Confirmed`, `Completed`, `Cancelled`) |
| `/scheduling/{id}/reschedule` | `PATCH` | Admin, Receptionist, Specialist | Required | Reschedule appointment with conflict check |
| `/scheduling/{id}` | `DELETE` | Admin | Required | Remove appointment |
| `/medical-records` | `GET`, `POST` | Admin, Assigned Specialist | Required | Patient medical records |
| `/medical-records/{id}` | `GET`, `PUT`, `DELETE` | Admin, Assigned Specialist | Required | Medical record CRUD with vitals |
| `/prescriptions` | `GET`, `POST` | Admin, Assigned Specialist | Required | Issue patient prescription |
| `/prescriptions/{id}` | `GET`, `DELETE` | Admin, Assigned Specialist | Required | Prescription details & line items |

---

## 5. Implementation Roadmap (Phases 1 - 9)

### Phase 1: Environment & Project Setup
- Verify toolchain: .NET 8/10 SDK, Node.js 22+, Angular CLI 22+, SQL Server (LocalDB / Developer / Express / Docker).
- Scaffold `.NET` Solution (`MedApp.sln`) with `Domain`, `Application`, `Infrastructure`, `Api`.
- Scaffold `Angular 22` client (`medapp`) with standalone components, signals, and typed routing.

### Phase 2: Domain, EF Core MSSQL Schema & Migrations
- Define all entities inheriting `BaseEntity` (`Guid Id, DateTime CreatedAt, DateTime? UpdatedAt`).
- Fluent entity configurations with SQL Server types (`nvarchar`, `bit`, `decimal(5,2)`, `datetimeoffset`), indexes, and composite keys (`UserCompanies`).
- Implement `ICompanyContext` interface and EF query filters for multi-tenant isolation.
- Generate and apply initial EF migration targeting SQL Server: `InitialCreate`.

### Phase 3: Authentication, Middleware & Security Hardening
- Implement BCrypt password hashing & JWT token provider (`ITokenService`).
- Implement `TenantResolutionMiddleware` validating `X-Company-Id` against user company claims.
- Configure ASP.NET Core authorization policies (`AdminOnly`, `ClinicalStaff`, `SpecialistSelf`).
- Implement global problem JSON exception handling middleware.

### Phase 4: Application Layer & Scheduling Engine
- Service implementations with FluentValidation for referential integrity.
- **Slot Calculation Engine**: Dynamic 30-minute interval generation based on specialist weekly schedule minus non-cancelled appointments.
- Concurrency & overlap validation: $\text{existing.Start} < \text{requested.End} \land \text{requested.Start} < \text{existing.End}$.

### Phase 5: REST Controllers & Automated Test Suite
- Implement API controllers returning standardized envelope responses.
- Setup Swagger with JWT Bearer and `X-Company-Id` header authentication.
- Implement integration tests using `WebApplicationFactory` and SQL Server LocalDB / Testcontainers to verify authentication, tenant boundaries, and scheduling conflicts.

### Phase 6: Angular 22 Core Architecture & Layout Shell
- Core services with Signals: `AuthService`, `CompanyContextService`, `ThemeService` (Dark/Light), `ToastService`.
- Functional HTTP interceptor injecting `Bearer` token and `X-Company-Id`.
- Functional route guards: `authGuard`, `companyGuard`, `roleGuard`.
- Responsive application shell: Top navbar with tenant switcher and role badge, role-filtered collapsible sidebar, bottom-right toast notification container.

### Phase 7: Administrative Feature Modules (Angular 22)
- Company selector and Admin Company Management table (`/companies`, `/admin/select-company`).
- Area and Specialty hierarchical management (`/areas`, `/specialties`).
- Specialists directory and 7-day Weekly Availability matrix (`/specialists`, `/specialists/:id/availability`).
- Interventions catalogue with duration and anesthesia/hospitalization indicators (`/interventions`).
- User account and company membership management (`/users`).

### Phase 8: Operational & Clinical Feature Modules (Angular 22)
- **Role-Adaptive Dashboard** (`/dashboard`): Admin collapsible tree view (`Company -> Area -> Specialty -> Specialists/Interventions`) vs. Receptionist/Specialist patient summary stats.
- **Patients Module** (`/patients`, `/patients/:id`): Searchable directory, registration form, and 4-Tab Profile (Personal Info, Appointments, Medical Notes with vitals, Prescriptions).
- **6-Step Booking Wizard** (`/scheduling/new`): Patient -> Area -> Specialty -> Intervention -> Specialist -> Date & 30-min Slot Picker with contextual breadcrumbs.
- **Appointment Lifecycle** (`/scheduling`): Status update modal (`Confirmed`, `Completed`, `Cancelled`) and Rescheduling flow.
- **Prescription Print View** (`/patients/:id/prescriptions/:rxId/print`): Clean `@media print` layout with clinic letterhead, doctor info, patient demographics, and medication table.

### Phase 9: Quality Assurance, Accessibility & Validation
- Comply with CSS budget limits (<4kB per component), fix any nested toast variables, eliminate unused imports.
- Verify full WCAG AA accessibility: keyboard navigation, ARIA attributes, modal focus traps, screen reader alerts.
- Execute acceptance verification for all tasks (F-01 through S-04).

---

## 6. Functional Acceptance Verification Matrix

| Task ID | Task Description | Role(s) | Key Verification Criteria |
| :--- | :--- | :--- | :--- |
| **F-01** | Authentication & Session | All | Valid login produces JWT in `sessionStorage`; invalid login shows error; expired token routes to `/login`; no plain passwords stored/logged. |
| **F-02** | Company Context Selection | All | Cannot enter dashboard without selected company; non-admin can only select assigned companies; switching company reloads all data. |
| **F-03** | Shell & Layout | All | Sidebar renders permitted routes only; theme toggle persists in `localStorage`; toasts auto-dismiss in 3.5s; logout clears session. |
| **F-04** | Role-Adaptive Dashboard | All | Admin sees organization tree (`Company -> Area -> Specialty -> Specialists/Interventions`); staff sees patient stats and quick list. |
| **A-01** | Company Management | Admin | Full CRUD on companies in MSSQL; non-admins receive 403; required fields and email validation enforced. |
| **A-02** | Areas & Specialties | Admin | Specialty requires area in same company; cross-company references rejected; deleting parent with children is blocked by MSSQL FK constraints. |
| **A-03** | Specialists & Availability | Admin | Specialty dropdown limited to active company; 7-day availability grid correctly persists start/end hours; inactive specialists excluded from booking. |
| **A-04** | Intervention Types | Admin | Duration is positive minutes; anesthesia/hospitalization flags saved; inactive procedures hidden in booking wizard. |
| **A-05** | User Accounts & Membership | Admin | Unique username enforced in MSSQL; BCrypt hashed password; assigned companies determine tenant access on next login. |
| **C-01** | Patient Directory & CRUD | Admin, Receptionist, Specialist | Demographics and document ID required; age computed from DOB; duplicate document ID per company rejected by MSSQL index; delete restricted to Admin. |
| **C-02** | Patient 4-Tab Profile | Admin, Receptionist, Specialist | Displays Personal Info, Appointments, Medical Notes, and Prescriptions tabs scoped to active tenant. |
| **C-03** | Medical Records & Vitals | Admin, Assigned Specialist | Diagnosis required; vitals stored accurately in MSSQL decimal/int columns; receptionists receive 403 Forbidden; records appear chronologically in profile. |
| **C-04** | Prescriptions & Print View | Admin, Assigned Specialist | Multi-item medication table with dosage/frequency/duration; printable page with clinic letterhead; receptionist forbidden. |
| **S-01** | 6-Step Booking Wizard | Admin, Receptionist, Specialist | Downstream filtering; dynamic 30-min slot calculation; past dates blocked; overlapping bookings rejected with 409 Conflict. |
| **S-02** | Scheduling Filter & List | Admin, Receptionist, Specialist | Filter by date/specialist/patient; joined patient and doctor names displayed; out-of-tenant IDs return 404. |
| **S-03** | Status Transition & Reschedule | Admin, Receptionist, Specialist | `Scheduled` -> `Confirmed`/`Completed`/`Cancelled`; rescheduling validates new slot availability and releases old slot. |
| **S-04** | Delete Appointment | Admin | Restricted to Admin; frees specialist slot; soft-delete or audit trail preserved. |
