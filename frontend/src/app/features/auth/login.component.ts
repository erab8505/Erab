import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CompanyContextService } from '../../core/services/company-context.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <!-- Brand Header -->
        <div class="login-header">
          <div class="brand-badge">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <h1 class="login-title">MedApp</h1>
          <p class="login-subtitle">Sistema Integral de Gestión Médica Multi-Empresa</p>
        </div>

        <!-- Error Alert -->
        @if (errorMessage()) {
          <div class="error-alert">
            <svg class="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">Usuario</label>
            <div class="input-container">
              <svg class="input-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <input 
                id="username"
                type="text" 
                formControlName="username" 
                class="form-control"
                placeholder="Ej. admin"
                autocomplete="username"
                [class.is-invalid]="isFieldInvalid('username')" />
            </div>
            @if (isFieldInvalid('username')) {
              <div class="field-error">El nombre de usuario es obligatorio</div>
            }
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <div class="input-container">
              <svg class="input-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <input 
                id="password"
                [type]="showPassword() ? 'text' : 'password'" 
                formControlName="password" 
                class="form-control"
                placeholder="••••••••"
                autocomplete="current-password"
                [class.is-invalid]="isFieldInvalid('password')" />
              <button 
                type="button" 
                class="toggle-password-btn" 
                (click)="togglePasswordVisibility()"
                tabindex="-1"
                aria-label="Mostrar u ocultar contraseña">
                @if (showPassword()) {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                  </svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                }
              </button>
            </div>
            @if (isFieldInvalid('password')) {
              <div class="field-error">La contraseña es obligatoria</div>
            }
          </div>

          <button 
            type="submit" 
            class="submit-btn" 
            [disabled]="loginForm.invalid || loading()">
            @if (loading()) {
              <span class="spinner-sm"></span>
              <span>Iniciando sesión...</span>
            } @else {
              <span>Iniciar Sesión</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            }
          </button>
        </form>

        <div class="login-footer">
          <p>Credenciales de demostración: <br><b>admin</b> / <b>admin123</b></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    }
    .login-card {
      width: 100%;
      max-width: 26rem;
      background: #ffffff;
      border-radius: 1rem;
      padding: 2.25rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    :host-context(.dark) .login-card {
      background: #1e293b;
      border: 1px solid #334155;
    }
    .login-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }
    .brand-badge {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
      margin-bottom: 1rem;
    }
    .login-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.025em;
    }
    :host-context(.dark) .login-title { color: #f8fafc; }
    .login-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.375rem 0 0 0;
    }
    .error-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background-color: #fee2e2;
      color: #b91c1c;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
      border: 1px solid #fecaca;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
    }
    :host-context(.dark) .form-label { color: #cbd5e1; }
    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 0.875rem;
      color: #94a3b8;
      pointer-events: none;
    }
    .form-control {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 2.5rem;
      font-size: 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      background-color: #ffffff;
      color: #0f172a;
      outline: none;
      transition: all 0.15s ease;
    }
    :host-context(.dark) .form-control {
      background-color: #0f172a;
      border-color: #334155;
      color: #f8fafc;
    }
    .form-control:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }
    .form-control.is-invalid {
      border-color: #ef4444;
    }
    .toggle-password-btn {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.25rem;
    }
    .toggle-password-btn:hover { color: #475569; }
    .field-error {
      font-size: 0.75rem;
      color: #ef4444;
      font-weight: 500;
    }
    .submit-btn {
      margin-top: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.15s;
    }
    .submit-btn:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
      filter: brightness(1.05);
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .login-footer {
      margin-top: 1.75rem;
      text-align: center;
      font-size: 0.75rem;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 1.25rem;
    }
    :host-context(.dark) .login-footer { border-top-color: #334155; }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly companyService = inject(CompanyContextService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly showPassword = signal<boolean>(false);

  isFieldInvalid(field: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success && response.data) {
          this.toastService.success(`Bienvenido, ${response.data.username}`);

          const companies = response.data.companies || [];
          if (companies.length === 1) {
            this.companyService.setActiveCompany(companies[0]);
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigate(['/select-company']);
          }
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Usuario o contraseña incorrectos.');
      }
    });
  }
}
