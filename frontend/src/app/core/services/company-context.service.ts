import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CompanyDto, CompanyFeatureKeys } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CompanyContextService {
  private readonly http = inject(HttpClient);
  private readonly activeCompanyKey = 'medapp_active_company';

  readonly activeCompany = signal<CompanyDto | null>(this.getStoredActiveCompany());
  readonly assignedCompanies = signal<CompanyDto[]>([]);

  readonly activeCompanyId = computed(() => this.activeCompany()?.id ?? null);
  readonly activeCompanyName = computed(() => this.activeCompany()?.name ?? 'Sin Empresa');
  readonly hasActiveCompany = computed(() => !!this.activeCompany());

  hasFeature(featureKey: string): boolean {
    const company = this.activeCompany();
    if (!company) return false;
    if (!company.features) return true;
    return company.features[featureKey] ?? false;
  }

  readonly hasScheduling = computed(() => this.hasFeature(CompanyFeatureKeys.ModuleScheduling));
  readonly hasLaboratory = computed(() => this.hasFeature(CompanyFeatureKeys.ModuleLaboratory));
  readonly canReceptionistCreateStudies = computed(() => this.hasFeature(CompanyFeatureKeys.AllowReceptionistStudyOrders));

  setActiveCompany(company: CompanyDto): void {
    this.activeCompany.set(company);
    localStorage.setItem(this.activeCompanyKey, JSON.stringify(company));
  }

  clearActiveCompany(): void {
    this.activeCompany.set(null);
    localStorage.removeItem(this.activeCompanyKey);
  }

  resetContext(): void {
    this.activeCompany.set(null);
    this.assignedCompanies.set([]);
    localStorage.removeItem(this.activeCompanyKey);
  }

  loadMyCompanies(): Observable<ApiResponse<CompanyDto[]>> {
    return this.http.get<ApiResponse<CompanyDto[]>>(`${environment.apiUrl}/companies/mine`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.assignedCompanies.set(res.data);
          
          // Auto-select if single company or if current active is no longer valid, or refresh active company
          const current = this.activeCompany();
          if (res.data.length === 1) {
            this.setActiveCompany(res.data[0]);
          } else if (current) {
            const matching = res.data.find(c => c.id === current.id);
            if (matching) {
              this.setActiveCompany(matching);
            } else {
              this.clearActiveCompany();
            }
          }
        }
      })
    );
  }

  loadAllCompanies(): Observable<ApiResponse<CompanyDto[]>> {
    return this.http.get<ApiResponse<CompanyDto[]>>(`${environment.apiUrl}/companies`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.assignedCompanies.set(res.data);

          const current = this.activeCompany();
          if (current) {
            const matching = res.data.find(c => c.id === current.id);
            if (matching) {
              this.setActiveCompany(matching);
            }
          }
        }
      })
    );
  }

  private getStoredActiveCompany(): CompanyDto | null {
    const stored = localStorage.getItem(this.activeCompanyKey);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as CompanyDto;
    } catch {
      return null;
    }
  }
}
