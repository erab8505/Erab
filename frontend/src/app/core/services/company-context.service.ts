import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CompanyDto } from '../models/models';

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

  setActiveCompany(company: CompanyDto): void {
    this.activeCompany.set(company);
    localStorage.setItem(this.activeCompanyKey, JSON.stringify(company));
  }

  clearActiveCompany(): void {
    this.activeCompany.set(null);
    localStorage.removeItem(this.activeCompanyKey);
  }

  loadMyCompanies(): Observable<ApiResponse<CompanyDto[]>> {
    return this.http.get<ApiResponse<CompanyDto[]>>(`${environment.apiUrl}/companies/mine`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.assignedCompanies.set(res.data);
          
          // Auto-select if single company or if current active is no longer valid
          const current = this.activeCompany();
          if (res.data.length === 1) {
            this.setActiveCompany(res.data[0]);
          } else if (current && !res.data.some(c => c.id === current.id)) {
            this.clearActiveCompany();
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
