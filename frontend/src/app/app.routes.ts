import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { companyGuard } from './core/guards/company.guard';
import { roleGuard } from './core/guards/role.guard';
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
        canActivate: [roleGuard(['Admin'])]
      },
      {
        path: 'areas',
        loadComponent: () => import('./features/admin/areas/area-list.component').then(m => m.AreaListComponent),
        canActivate: [roleGuard(['Admin'])]
      },
      {
        path: 'specialties',
        loadComponent: () => import('./features/admin/specialties/specialty-list.component').then(m => m.SpecialtyListComponent),
        canActivate: [roleGuard(['Admin'])]
      },
      {
        path: 'specialists',
        loadComponent: () => import('./features/admin/specialists/specialist-list.component').then(m => m.SpecialistListComponent),
        canActivate: [roleGuard(['Admin'])]
      },
      {
        path: 'specialists/:id/availability',
        loadComponent: () => import('./features/admin/specialists/specialist-availability.component').then(m => m.SpecialistAvailabilityComponent),
        canActivate: [roleGuard(['Admin', 'Specialist'])]
      },
      {
        path: 'interventions',
        loadComponent: () => import('./features/admin/interventions/intervention-list.component').then(m => m.InterventionListComponent),
        canActivate: [roleGuard(['Admin'])]
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/user-list.component').then(m => m.UserListComponent),
        canActivate: [roleGuard(['Admin'])]
      },
      // Patient & Clinical Routes
      {
        path: 'patients',
        loadComponent: () => import('./features/patients/patient-list.component').then(m => m.PatientListComponent)
      },
      {
        path: 'patients/:id',
        loadComponent: () => import('./features/patients/patient-detail.component').then(m => m.PatientDetailComponent)
      },
      // Scheduling Routes
      {
        path: 'scheduling',
        loadComponent: () => import('./features/scheduling/scheduling-list.component').then(m => m.SchedulingListComponent)
      },
      {
        path: 'scheduling/new',
        loadComponent: () => import('./features/scheduling/booking-wizard.component').then(m => m.BookingWizardComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
