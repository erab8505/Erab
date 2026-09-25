import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CompanyContextService } from '../services/company-context.service';
import { ToastService } from '../services/toast.service';

export const moduleGuard = (featureKey: string, moduleName: string = 'este módulo'): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const companyService = inject(CompanyContextService);
    const router = inject(Router);
    const toastService = inject(ToastService);

    if (authService.isSuperAdmin() || companyService.hasFeature(featureKey)) {
      return true;
    }

    toastService.warning(`La empresa activa no tiene habilitado ${moduleName}.`, 'Módulo no disponible');
    return router.createUrlTree(['/dashboard']);
  };
};
