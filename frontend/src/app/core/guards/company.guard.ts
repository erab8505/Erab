import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CompanyContextService } from '../services/company-context.service';

export const companyGuard: CanActivateFn = () => {
  const companyService = inject(CompanyContextService);
  const router = inject(Router);

  if (companyService.hasActiveCompany()) {
    return true;
  }

  return router.createUrlTree(['/select-company']);
};
