import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CompanyContextService } from '../services/company-context.service';

export const authAndTenantInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const companyService = inject(CompanyContextService);

  const token = authService.token();
  const companyId = companyService.activeCompanyId();

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (companyId) {
    headers = headers.set('X-Company-Id', companyId);
  }

  const modifiedReq = req.clone({ headers });
  return next(modifiedReq);
};
