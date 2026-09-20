# MedApp Implementation Tasks

This document contains the actionable, step-by-step task breakdown for building and hardening the MedApp multi-tenant medical management system with **Microsoft SQL Server (MSSQL)** and **Angular 22**. It maps technical deliverables directly to the architectural phases and functional acceptance test cases.

---

## Task Progress Summary

- **Phase 1: Environment & Scaffolding** `[4/4]`
- **Phase 2: Domain Entities & Database Migrations (MSSQL)** `[5/5]`
- **Phase 3: Authentication, Context & Security** `[5/5]`
- **Phase 4: Application Layer & Scheduling Engine** `[5/5]`
- **Phase 5: REST API Controllers & Integration Tests** `[0/5]`
- **Phase 6: Angular Core Architecture & Shell Layout** `[0/6]`
- **Phase 7: Administration Features (Frontend)** `[0/6]`
- **Phase 8: Clinical & Operational Features (Frontend)** `[0/6]`
- **Phase 9: Quality, Accessibility & E2E Validation** `[0/4]`

---

## Phase 1: Environment & Project Scaffolding

- [x] **TASK-01: Initialize .NET Solution & Projects**
  - **Description**: Scaffold clean architecture solution (`MedApp.sln`) with .NET 8/10 SDK in `backend/`.
  - **Projects**:
    - `MedApp.Domain` (Class library)
    - `MedApp.Application` (Class library)
    - `MedApp.Infrastructure` (Class library)
    - `MedApp.Api` (Web API)
  - **References**: `Api -> Application, Infrastructure`; `Infrastructure -> Application, Domain`; `Application -> Domain`.
  - **Dependencies**: None.

- [x] **TASK-02: Configure Dependencies & NuGet Packages for MSSQL**
  - **Description**: Install required, secure NuGet packages targeting Microsoft SQL Server without vulnerability warnings.
  - **Packages**:
    - `Microsoft.EntityFrameworkCore.SqlServer`
    - `Microsoft.EntityFrameworkCore.Design`
    - `Microsoft.AspNetCore.Authentication.JwtBearer`
    - `BCrypt.Net-Next`
    - `FluentValidation.AspNetCore`
    - `Swashbuckle.AspNetCore`
  - **Dependencies**: TASK-01.

- [x] **TASK-03: Initialize Angular 22 Client Application**
  - **Description**: Scaffold Angular standalone app in `frontend/` directory.
  - **Configuration**:
    - Standalone components enabled by default
    - Routing and CSS configured
    - `angular.json` strict style budgets (<4kB component styles)
    - Environment files (`environment.ts`, `environment.development.ts`) with API baseUrl `http://localhost:5084/api`.
  - **Dependencies**: None.

- [x] **TASK-04: Git Repository & Workspace Setup**
  - **Description**: Configure root `.gitignore` (ignoring `bin/`, `obj/`, `node_modules/`, `.angular/`, `dist/`, `*.mdf`, `*.ldf`, `.idea/`, `.vscode/`).
  - **Dependencies**: TASK-01, TASK-03.

---

## Phase 2: Domain Entities & Database Migrations (MSSQL)

- [x] **TASK-05: Implement Base Entity & Domain Enums**
  - **Description**: Create `BaseEntity` (`Guid Id`, `DateTime CreatedAt`, `DateTime? UpdatedAt`) and domain enums:
    - `UserRole` (`Admin`, `Receptionist`, `Specialist`)
    - `Gender` (`M`, `F`, `O`)
    - `AppointmentStatus` (`Scheduled`, `Confirmed`, `Completed`, `Cancelled`, `Rescheduled`)
  - **Dependencies**: TASK-01.

- [x] **TASK-06: Implement Domain Entities**
  - **Description**: Define all core entities in `MedApp.Domain`:
    - `Company`, `User`, `UserCompany`
    - `Area`, `Specialty`, `Specialist`, `SpecialistAvailability`
    - `InterventionType`, `Patient`, `Scheduling`
    - `MedicalRecord`, `Prescription`, `PrescriptionItem`
  - **Dependencies**: TASK-05.

- [x] **TASK-07: Implement EF Core DbContext & MSSQL Entity Configurations**
  - **Description**: Configure `MedAppDbContext` in `MedApp.Infrastructure` with `IEntityTypeConfiguration<T>` for all entities targeting SQL Server column types and index filters.
  - **Key Constraints**:
    - Composite PK on `UserCompany (UserId, CompanyId)`
    - Filtered unique index on `Companies.TaxId` (WHERE TaxId IS NOT NULL)
    - Unique index on `Users.Username`
    - Unique index on `Specialists (CompanyId, LicenseNumber)`
    - Unique index on `Patients (CompanyId, DocumentId)`
    - Filtered unique index on `InterventionTypes (CompanyId, Code)` (WHERE Code IS NOT NULL)
    - Index on `Schedulings (SpecialistId, ScheduledAt)`
    - Cascade delete on `PrescriptionItem` from `Prescription`
    - Restrict/NoAction delete on parent hierarchies (`Company`, `Area`, `Specialty`, `Patient`) to avoid multiple cascade path cycles in MSSQL.
    - Explicit precision for clinical decimals: `WeightKg` decimal(5,2), `HeightCm` decimal(5,2), `TemperatureCelsius` decimal(4,1).
  - **Dependencies**: TASK-06.

- [x] **TASK-08: Implement Tenant-Scoped Context & Query Filters**
  - **Description**: Implement `ICompanyContext` and register query filters on all tenant entities (`CompanyId == _companyContext.CompanyId`) to ensure database-level isolation.
  - **Dependencies**: TASK-07.

- [x] **TASK-09: Create MSSQL EF Migration & Migration Runner**
  - **Description**: Generate initial migration `InitialCreate` with `Microsoft.EntityFrameworkCore.SqlServer` and configure startup to execute `Database.MigrateAsync()` (never `EnsureCreatedAsync()`). Add seed data for default admin.
  - **Dependencies**: TASK-08.

---

## Phase 3: Authentication, Context & Security Hardening

- [x] **TASK-10: Implement Password Hashing & JWT Token Service**
  - **Description**: Implement `IPasswordHasher` using BCrypt and `ITokenService` generating JWT with claims (`sub`, `name`, `role`, `companyIds`, `specialistId`).
  - **Dependencies**: TASK-02, TASK-06.

- [x] **TASK-11: Implement Tenant Resolution Middleware**
  - **Description**: Create ASP.NET Core middleware to intercept `X-Company-Id` header, validate company membership from JWT claims, and populate scoped `ICompanyContext`. Return `403 Forbidden` if user lacks access to requested company.
  - **Dependencies**: TASK-08, TASK-10.

- [x] **TASK-12: Implement Authorization Policies & Handlers**
  - **Description**: Register ASP.NET Core authorization policies:
    - `RequireAdminRole`: Admin only.
    - `RequireClinicalRole`: Admin or Specialist.
    - `RequireSpecialistSelfOrAdmin`: Enforces that specialists can only manage their own availability, appointments, and prescriptions.
  - **Dependencies**: TASK-10, TASK-11.

- [x] **TASK-13: Global Exception Handler & Standard Envelope**
  - **Description**: Implement exception handling middleware returning standardized JSON responses:
    `{ "success": boolean, "message": string, "data": T, "errors": string[] }`.
  - **Dependencies**: TASK-01.

- [x] **TASK-14: Swagger Configuration with Security Schemes**
  - **Description**: Configure Swagger / OpenAPI in `MedApp.Api` with Bearer token authentication and `X-Company-Id` header parameter.
  - **Dependencies**: TASK-11, TASK-13.

---

## Phase 4: Application Layer & Scheduling Engine

- [x] **TASK-15: Organization & Catalogue Services**
  - **Description**: Implement DTOs, FluentValidation rules, and services for:
    - `CompanyService`
    - `AreaService` & `SpecialtyService`
    - `SpecialistService` & `SpecialistAvailabilityService`
    - `InterventionTypeService`
    - Referential integrity validations (e.g. ensuring `Area` belongs to the active `Company` when creating a `Specialty`).
  - **Dependencies**: TASK-07, TASK-12.

- [x] **TASK-16: User Management Service**
  - **Description**: Implement `UserService` for creating/updating users, assigning roles, linking optional `SpecialistId`, and managing `UserCompanies` memberships.
  - **Dependencies**: TASK-10, TASK-15.

- [x] **TASK-17: Patient Service**
  - **Description**: Implement `PatientService` supporting tenant-scoped search, registration, demographic validation, unique document ID per company, and age computation.
  - **Dependencies**: TASK-08, TASK-15.

- [x] **TASK-18: Scheduling & Dynamic Slot Engine**
  - **Description**: Implement `SchedulingService`:
    - Dynamic slot generation: takes `specialistId` and `date`, inspects `SpecialistAvailability` for that weekday, slices into 30-min intervals, and excludes booked/overlapping intervals.
    - Booking creation with conflict detection:
      $$\text{existing.Start} < \text{requested.End} \land \text{requested.Start} < \text{existing.End}$$
    - Rescheduling & Status transition rules (`Scheduled` -> `Confirmed`, `Completed`, `Cancelled`, `Rescheduled`).
  - **Dependencies**: TASK-15, TASK-17.

- [x] **TASK-19: Clinical Records & Prescription Services**
  - **Description**: Implement `MedicalRecordService` and `PrescriptionService`:
    - Vital signs capture (BP, pulse, temp, O2 sat, weight, height)
    - Multi-item prescription management (medication name, dosage, frequency, duration, instructions)
    - Server-side verification that Specialist matches the current user or user is Admin.
  - **Dependencies**: TASK-17, TASK-18.

---

## Phase 5: REST API Controllers & Integration Tests

- [ ] **TASK-20: Authentication & Health Controllers**
  - **Description**: Implement `AuthController` (`POST /api/auth/login`) and `HealthController` (`GET /api/health`, `GET /api/health/db` checking MSSQL connectivity).
  - **Dependencies**: TASK-10, TASK-13.

- [ ] **TASK-21: Administrative API Controllers**
  - **Description**: Implement controllers:
    - `CompaniesController` (`/api/companies`, `/api/companies/mine`)
    - `AreasController` (`/api/areas`)
    - `SpecialtiesController` (`/api/specialties`)
    - `SpecialistsController` (`/api/specialists`, `/api/specialists/{id}/availability`, `/api/specialists/{id}/slots`)
    - `SpecialistAvailabilityController` (`/api/specialist-availability`)
    - `InterventionTypesController` (`/api/intervention-types`)
    - `UsersController` (`/api/users`)
  - **Dependencies**: TASK-15, TASK-16.

- [ ] **TASK-22: Patient & Scheduling Controllers**
  - **Description**: Implement `PatientsController` (`/api/patients`) and `SchedulingController` (`/api/scheduling`, `/api/scheduling/{id}/status`, `/api/scheduling/{id}/reschedule`).
  - **Dependencies**: TASK-17, TASK-18.

- [ ] **TASK-23: Clinical API Controllers (Secured)**
  - **Description**: Implement `MedicalRecordsController` (`/api/medical-records`) and `PrescriptionsController` (`/api/prescriptions`) with `[Authorize(Policy = "RequireClinicalRole")]`.
  - **Dependencies**: TASK-19.

- [ ] **TASK-24: Automated Backend Integration Tests**
  - **Description**: Implement automated integration tests using `WebApplicationFactory` and SQL Server LocalDB / Testcontainers / in-memory context:
    - Tenant isolation: User A in Company 1 cannot query Company 2 entities.
    - Clinical authorization: Receptionist receives `403` on `/api/medical-records`.
    - Scheduling concurrency & overlap rejection.
  - **Dependencies**: TASK-20, TASK-21, TASK-22, TASK-23.

---

## Phase 6: Angular Core Architecture & Layout Shell

- [ ] **TASK-25: Core State Services (Signals-Based)**
  - **Description**: Implement standalone injectable services in `src/app/core/services`:
    - `AuthService`: `currentUser = signal(...)`, `isAuthenticated = computed(...)`, JWT decoding, login/logout.
    - `CompanyContextService`: `activeCompany = signal(...)`, `assignedCompanies = signal(...)`, tenant switching.
    - `ThemeService`: Dark/Light theme switching persisted to `localStorage`.
    - `ToastService`: Reactive toast alerts (success, error, warning) with auto-dismiss at 3.5s.
  - **Dependencies**: TASK-03.

- [ ] **TASK-26: Functional Interceptors & Guards**
  - **Description**: Implement in `src/app/core`:
    - `authAndTenantInterceptor`: Injects `Authorization: Bearer <token>` and `X-Company-Id: <id>`.
    - `errorInterceptor`: Catches 401/403/500 and emits toasts.
    - `authGuard`, `companyGuard`, `roleGuard`.
  - **Dependencies**: TASK-25.

- [ ] **TASK-27: Application Shell & Navigation Layout**
  - **Description**: Create standalone `ShellComponent` containing:
    - Top Navbar: Active company name, user role badge, theme toggle, switch company button, logout button.
    - Responsive Sidebar: Role-filtered navigation links (Admin sees full catalogue; Receptionist/Specialist see Dashboard, Patients, Scheduling).
    - Bottom-right Toast container component.
  - **Dependencies**: TASK-26.

- [ ] **TASK-28: Authentication & Company Selection Views**
  - **Description**: Implement:
    - `LoginComponent` (`/login`): Reactive form with validation and error display.
    - `SelectCompanyComponent` (`/select-company`): Company card grid for multi-company users.
    - `AdminSelectCompanyComponent` (`/admin/select-company`): Searchable company table with direct switch and manage buttons.
  - **Dependencies**: TASK-27.

- [ ] **TASK-29: Role-Adaptive Dashboard Component**
  - **Description**: Implement `DashboardComponent` (`/dashboard`):
    - Admin View: Collapsible organization tree (`Company -> Area -> Specialty -> Specialists / Interventions`) loaded in parallel via `forkJoin`.
    - Receptionist/Specialist View: Patient metrics cards (Total, Male, Female) and quick patient lookup table.
  - **Dependencies**: TASK-28.

- [ ] **TASK-30: Reusable Shared UI Components**
  - **Description**: Implement shared standalone components in `src/app/shared`:
    - `ModalComponent` (accessible dialog with focus trap and backdrop)
    - `DataTableComponent` (search, pagination, column sorting)
    - `ConfirmDialogComponent`
    - `BadgeComponent` (role, status, blood type)
  - **Dependencies**: TASK-03.

---

## Phase 7: Administration Features (Frontend)

- [ ] **TASK-31: Company Management Module**
  - **Description**: Implement `CompanyListComponent` and modal `CompanyFormComponent` for `/companies`. Form includes Name, Tax ID, Address, Phone, Email, Active checkbox, Description.
  - **Dependencies**: TASK-27, TASK-30.

- [ ] **TASK-32: Areas & Specialties Management**
  - **Description**: Implement `/areas` and `/specialties` views:
    - Area list & create/edit form.
    - Specialty list & create/edit form with Area dropdown scoped to active company.
  - **Dependencies**: TASK-30, TASK-31.

- [ ] **TASK-33: Specialists Directory**
  - **Description**: Implement `/specialists` view with list, search, create/edit form (First/Last name, License Number, Specialty dropdown, Email, Phone, Active).
  - **Dependencies**: TASK-32.

- [ ] **TASK-34: 7-Day Specialist Availability Grid**
  - **Description**: Implement `SpecialistAvailabilityComponent` (`/specialists/:id/availability`):
    - 7-day visual calendar grid (Sunday - Saturday)
    - Add time interval (From / To time pickers) with validation (`StartHour < EndHour`)
    - Day chips for configured intervals with instant delete action.
  - **Dependencies**: TASK-33.

- [ ] **TASK-35: Intervention Types Catalogue**
  - **Description**: Implement `/interventions` with list, CPT code, Specialty dropdown, Duration in minutes, Anesthesia/Hospitalization checkboxes, Active toggle.
  - **Dependencies**: TASK-32.

- [ ] **TASK-36: User Accounts & Company Membership**
  - **Description**: Implement `/users` view with user list, create/edit form (Username, Password, Role selector, Specialist profile linking, Multi-company assignment checkboxes).
  - **Dependencies**: TASK-31, TASK-33.

---

## Phase 8: Clinical & Operational Features (Frontend)

- [ ] **TASK-37: Patient Directory & Registration**
  - **Description**: Implement `/patients` and `/patients/new`, `/patients/:id/edit`:
    - Patient table with search, Document ID, DOB, computed age, Gender, Blood Type badge.
    - Reactive registration form with demographic and clinical fields (allergies, contact info).
  - **Dependencies**: TASK-30.

- [ ] **TASK-38: Patient 4-Tab Profile**
  - **Description**: Implement `PatientDetailComponent` (`/patients/:id`):
    - Tab 1: Personal Information & Demographics.
    - Tab 2: Appointments list with status badges and quick action buttons.
    - Tab 3: Medical Notes list with inline creation form and vital signs entry.
    - Tab 4: Prescriptions list with Print and Delete actions.
  - **Dependencies**: TASK-37.

- [ ] **TASK-39: 6-Step Appointment Booking Wizard**
  - **Description**: Implement `BookingWizardComponent` (`/scheduling/new`):
    - Step 1: Select Patient (searchable, auto-selected if launched from patient profile).
    - Step 2: Select Area.
    - Step 3: Select Specialty.
    - Step 4: Select Procedure / Intervention.
    - Step 5: Select Specialist.
    - Step 6: Select Date & 30-min Slot Picker (loaded dynamically from `/api/specialists/{id}/slots`).
    - Contextual breadcrumb header with "Change" buttons resetting downstream steps.
  - **Dependencies**: TASK-34, TASK-35, TASK-37.

- [ ] **TASK-40: Scheduling Directory & Status Transitions**
  - **Description**: Implement `SchedulingListComponent` (`/scheduling`):
    - Filterable table by date range, specialist, status.
    - Action buttons: Mark as Done (`completed`), Cancel (`cancelled`).
    - Reschedule modal with new date/slot picker.
  - **Dependencies**: TASK-39.

- [ ] **TASK-41: Prescription Issuance Modal & Management**
  - **Description**: Implement Prescription creation modal inside Patient Profile:
    - Select prescribing specialist and optional medical record.
    - Dynamic multi-item FormArray: Medication name, dosage, frequency, duration (days), instructions.
  - **Dependencies**: TASK-38.

- [ ] **TASK-42: Prescription Print Page**
  - **Description**: Implement dedicated printable view (`/patients/:id/prescriptions/:rxId/print`):
    - Clean `@media print` CSS layout.
    - Clinic letterhead (Company name, Tax ID, address, contact).
    - Prescribing doctor details, patient demographics, prescription date, structured medication table, and notes.
  - **Dependencies**: TASK-41.

---

## Phase 9: Quality, Accessibility & Acceptance Validation

- [ ] **TASK-43: CSS Optimization & Budget Compliance**
  - **Description**: Fix any nested CSS issues, remove unused imports, ensure all component stylesheets strictly meet the <4kB budget or configure explicit budgets in `angular.json`.
  - **Dependencies**: TASK-27 through TASK-42.

- [ ] **TASK-44: Accessibility (A11y) & Usability Audit**
  - **Description**: Validate keyboard navigation (`Tab`, `Enter`, `Escape`), ARIA labels on icon buttons, focus trap in modal dialogs, and contrast ratios conforming to WCAG AA.
  - **Dependencies**: TASK-43.

- [ ] **TASK-45: End-to-End Acceptance Test Verification**
  - **Description**: Execute and verify all 17 functional acceptance tasks against the MSSQL backend:
    - Foundation: F-01 (Auth), F-02 (Company Context), F-03 (Shell), F-04 (Dashboard)
    - Administration: A-01 (Companies), A-02 (Areas/Specialties), A-03 (Specialists/Availability), A-04 (Interventions), A-05 (Users)
    - Patient & Clinical: C-01 (Patients), C-02 (4-Tab Profile), C-03 (Medical Records), C-04 (Prescriptions & Print)
    - Scheduling: S-01 (Booking Wizard), S-02 (Scheduling List), S-03 (Status & Reschedule), S-04 (Delete Appointment).
  - **Dependencies**: TASK-24, TASK-44.

- [ ] **TASK-46: Build & Production Readiness Verification**
  - **Description**: Verify clean production builds for both backend (`dotnet build -c Release`) and frontend (`npm run build --configuration production`) with zero compiler warnings or lint errors.
  - **Dependencies**: TASK-45.
