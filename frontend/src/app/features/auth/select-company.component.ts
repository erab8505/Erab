import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CompanyContextService } from '../../core/services/company-context.service';
import { ToastService } from '../../core/services/toast.service';
import { CompanyDto } from '../../core/models/models';

@Component({
  selector: 'app-select-company',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="select-company-page">
      <div class="select-company-container">
        <!-- Header -->
        <div class="page-header">
          <div class="brand-icon">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <h2>Seleccione una Empresa</h2>
          <p>Elija la entidad o clínica con la que desea operar en esta sesión.</p>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <span class="spinner-sm"></span>
            <span>Cargando empresas asignadas...</span>
          </div>
        } @else if (companies().length === 0) {
          <div class="empty-state">
            <svg class="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <h3>Sin empresas asignadas</h3>
            <p>Su usuario no tiene empresas vinculadas activas. Contacte al administrador.</p>
            <button class="btn btn-secondary mt-4" (click)="authService.logout()">Cerrar Sesión</button>
          </div>
        } @else {
          <div class="companies-grid">
            @for (company of companies(); track company.id) {
              <div 
                class="company-card" 
                [class.active]="companyService.activeCompanyId() === company.id"
                (click)="onSelectCompany(company)">
                <div class="card-icon">
                  <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div class="card-content">
                  <h3 class="company-name">{{ company.name }}</h3>
                  @if (company.taxId) {
                    <span class="company-tax-id">NIT / RUC: {{ company.taxId }}</span>
                  }
                  @if (company.address) {
                    <span class="company-address">{{ company.address }}</span>
                  }
                </div>
                <div class="card-action">
                  <span class="select-badge">Entrar &rarr;</span>
                </div>
              </div>
            }
          </div>

          <div class="page-footer">
            <button type="button" class="btn btn-secondary" (click)="authService.logout()">
              Cerrar Sesión
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .select-company-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    }
    .select-company-container {
      width: 100%;
      max-width: 44rem;
      background: #ffffff;
      border-radius: 1rem;
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    :host-context(.dark) .select-company-container {
      background: #1e293b;
      border: 1px solid #334155;
    }
    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .brand-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .page-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    :host-context(.dark) .page-header h2 { color: #f8fafc; }
    .page-header p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.5rem 0 0 0;
    }
    .companies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .company-card {
      padding: 1.25rem;
      border-radius: 0.75rem;
      border: 2px solid #e2e8f0;
      background: #ffffff;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;
    }
    :host-context(.dark) .company-card {
      background: #0f172a;
      border-color: #334155;
    }
    .company-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }
    .company-card.active {
      border-color: #2563eb;
      background-color: #eff6ff;
    }
    :host-context(.dark) .company-card.active {
      background-color: rgba(37, 99, 235, 0.1);
      border-color: #3b82f6;
    }
    .card-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host-context(.dark) .card-icon { background: #1e293b; }
    .card-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }
    .company-name {
      font-size: 1.05rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    :host-context(.dark) .company-name { color: #f8fafc; }
    .company-tax-id, .company-address {
      font-size: 0.8125rem;
      color: #64748b;
    }
    .card-action {
      display: flex;
      justify-content: flex-end;
    }
    .select-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: #2563eb;
    }
    .page-footer {
      display: flex;
      justify-content: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 1.5rem;
    }
    :host-context(.dark) .page-footer { border-top-color: #334155; }
    .loading-state, .empty-state {
      text-align: center;
      padding: 2.5rem 0;
      color: #64748b;
    }
  `]
})
export class SelectCompanyComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly companyService = inject(CompanyContextService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(true);
  readonly companies = signal<CompanyDto[]>([]);

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.companyService.loadAllCompanies().subscribe({
        next: (res) => {
          this.loading.set(false);
          this.companies.set(res.data || []);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.companyService.loadMyCompanies().subscribe({
        next: (res) => {
          this.loading.set(false);
          this.companies.set(res.data || []);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  onSelectCompany(company: CompanyDto): void {
    this.companyService.setActiveCompany(company);
    this.toastService.info(`Empresa activa: ${company.name}`);
    this.router.navigate(['/dashboard']);
  }
}
