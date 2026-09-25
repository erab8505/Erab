import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { companyGuard } from './core/guards/company.guard';
import { roleGuard } from './core/guards/role.guard';
import { moduleGuard } from './core/guards/module.guard';
import { CompanyFeatureKeys } from './core/models/models';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './features/auth/login.component';
import { SelectCompanyComponent } from './features/auth/select-company.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'select-company',
    component: SelectCompanyComponent,
    canActivate: [authGuard]
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard, companyGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      // Admin Routes (Lazy-loadable or route modules)
      {
        path: 'companies',
        loadComponent: () => import('./features/admin/companies/company-list.component').then(m => m.CompanyListComponent),
        canActivate: [roleGuard(['SuperAdmin'])]
      },
      {
        path: 'areas',
        loadComponent: () => import('./features/admin/areas/area-list.component').then(m => m.AreaListComponent),
        canActivate: [roleGuard(['SuperAdmin', 'Admin'])]
      },
      {
        path: 'specialties',
        loadComponent: () => import('./features/admin/specialties/specialty-list.component').then(m => m.SpecialtyListComponent),
        canActivate: [roleGuard(['SuperAdmin', 'Admin'])]
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/admin/employees/employee-list.component').then(m => m.EmployeeListComponent),
        canActivate: [roleGuard(['SuperAdmin', 'Admin'])]
      },
      {
        path: 'employees/:id/availability',
        loadComponent: () => import('./features/admin/employees/employee-availability.component').then(m => m.EmployeeAvailabilityComponent),
        canActivate: [roleGuard(['SuperAdmin', 'Admin', 'Specialist'])]
      },
      {
        path: 'specialists',
        redirectTo: 'employees',
        pathMatch: 'full'
      },
      {
        path: 'specialists/:id/availability',
        loadComponent: () => import('./features/admin/employees/employee-availability.component').then(m => m.EmployeeAvailabilityComponent),
        canActivate: [roleGuard(['SuperAdmin', 'Admin', 'Specialist'])]
      },
      {
        path: 'interventions',
        loadComponent: () => import('./features/admin/interventions/intervention-list.component').then(m => m.InterventionListComponent),
        canActivate: [roleGuard(['SuperAdmin', 'Admin'])]
      },
      {
        path: 'receptionists',
        redirectTo: 'employees',
        pathMatch: 'full'
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/user-list.component').then(m => m.UserListComponent),
        canActivate: [roleGuard(['SuperAdmin', 'Admin'])]
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./features/admin/audit-logs/audit-log-list.component').then(m => m.AuditLogListComponent),
        canActivate: [roleGuard(['SuperAdmin', 'Admin'])]
      },
      // Patient & Clinical Routes
      {
        path: 'patients',
        loadComponent: () => import('./features/patients/patient-list.component').then(m => m.PatientListComponent)
      },
      {
        path: 'patients/:id',
        loadComponent: () => import('./features/patients/patient-detail.component').then(m => m.PatientDetailComponent),
        canActivate: [roleGuard(['SuperAdmin', 'Admin', 'Specialist', 'Receptionist'])]
      },
      // Scheduling Routes
      {
        path: 'scheduling',
        loadComponent: () => import('./features/scheduling/scheduling-list.component').then(m => m.SchedulingListComponent),
        canActivate: [moduleGuard(CompanyFeatureKeys.ModuleScheduling, 'la Agenda y Citas'), roleGuard(['SuperAdmin', 'Admin', 'Specialist', 'Receptionist'])]
      },
      {
        path: 'scheduling/new',
        loadComponent: () => import('./features/scheduling/booking-wizard.component').then(m => m.BookingWizardComponent),
        canActivate: [moduleGuard(CompanyFeatureKeys.ModuleScheduling, 'la Agenda y Citas'), roleGuard(['SuperAdmin', 'Admin', 'Specialist', 'Receptionist'])]
      },
      // Clinical Studies & Laboratory Routes
      {
        path: 'studies',
        loadComponent: () => import('./features/studies/study-order-list.component').then(m => m.StudyOrderListComponent),
        canActivate: [moduleGuard(CompanyFeatureKeys.ModuleLaboratory, 'el módulo de Laboratorio'), roleGuard(['SuperAdmin', 'Admin', 'Specialist', 'Laboratorist', 'Receptionist'])]
      },
      {
        path: 'studies/catalog',
        loadComponent: () => import('./features/studies/clinical-study-list.component').then(m => m.ClinicalStudyListComponent),
        canActivate: [moduleGuard(CompanyFeatureKeys.ModuleLaboratory, 'el catálogo de Laboratorio'), roleGuard(['SuperAdmin', 'Admin'])]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
