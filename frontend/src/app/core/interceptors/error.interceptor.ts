import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocurrió un error inesperado.';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors && Array.isArray(error.error.errors) && error.error.errors.length > 0) {
        errorMessage = error.error.errors.join(', ');
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }

      switch (error.status) {
        case 401:
          toastService.error('Su sesión ha expirado o no está autenticado.', 'Sesión requerida');
          authService.logout();
          break;

        case 403:
          toastService.error(errorMessage || 'No tiene permisos para acceder a este recurso o empresa.', 'Acceso denegado');
          break;

        case 404:
          toastService.warning(errorMessage || 'El recurso solicitado no fue encontrado.', 'No encontrado');
          break;

        case 409:
          toastService.warning(errorMessage || 'Existe un conflicto con los datos proporcionados.', 'Conflicto');
          break;

        case 400:
          toastService.error(errorMessage || 'Petición inválida.', 'Error de validación');
          break;

        case 500:
          toastService.error(errorMessage || 'Error interno del servidor. Intente más tarde.', 'Error del Servidor');
          break;

        case 0:
          toastService.error('No se pudo establecer conexión con el servidor backend.', 'Error de Conexión');
          break;
      }

      return throwError(() => error);
    })
  );
};
