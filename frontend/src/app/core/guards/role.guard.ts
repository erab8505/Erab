import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UserRole } from '../models/models';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);

    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    toastService.error('No tiene permisos para acceder a esta sección.', 'Acceso denegado');
    return router.createUrlTree(['/dashboard']);
  };
};
