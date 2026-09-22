import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequestDto, LoginResponseDto, UserRole, UserSession } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenKey = 'medapp_jwt_token';
  private readonly userKey = 'medapp_user_session';

  readonly token = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<UserSession | null>(this.getStoredUser());

  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly roles = computed<UserRole[]>(() => {
    const user = this.currentUser();
    if (!user) return [];
    if (user.roles && Array.isArray(user.roles)) return user.roles;
    if (user.role) return [user.role];
    return [];
  });
  readonly userRole = computed(() => this.roles()[0] ?? null);
  readonly employeeId = computed(() => this.currentUser()?.employeeId ?? this.currentUser()?.specialistId ?? null);
  readonly specialistId = computed(() => this.employeeId());
  readonly receptionistId = computed(() => this.currentUser()?.receptionistId ?? this.employeeId());
  readonly username = computed(() => this.currentUser()?.username ?? '');
  readonly profileName = computed(() => this.currentUser()?.profileName ?? null);
  readonly displayName = computed(() => this.currentUser()?.profileName || this.currentUser()?.username || '');

  login(credentials: LoginRequestDto): Observable<ApiResponse<LoginResponseDto>> {
    return this.http.post<ApiResponse<LoginResponseDto>>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('medapp_active_company');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(roles: UserRole[] | UserRole): boolean {
    const currentRoles = this.roles();
    if (Array.isArray(roles)) {
      return roles.some(r => currentRoles.includes(r));
    }
    return currentRoles.includes(roles);
  }

  isSuperAdmin(): boolean {
    return this.roles().includes('SuperAdmin');
  }

  isAdmin(): boolean {
    const r = this.roles();
    return r.includes('Admin') || r.includes('SuperAdmin');
  }

  isSpecialist(): boolean {
    return this.roles().includes('Specialist');
  }

  isReceptionist(): boolean {
    return this.roles().includes('Receptionist');
  }

  isLaboratorist(): boolean {
    return this.roles().includes('Laboratorist');
  }

  // Cumulative capabilities
  canAccessScheduling(): boolean {
    return this.hasRole(['SuperAdmin', 'Admin', 'Specialist', 'Receptionist']);
  }

  canManagePatients(): boolean {
    return this.hasRole(['SuperAdmin', 'Admin', 'Specialist', 'Receptionist']);
  }

  canViewMedicalRecords(): boolean {
    return this.hasRole(['SuperAdmin', 'Admin', 'Specialist']);
  }

  canCreateMedicalRecords(): boolean {
    return this.hasRole(['SuperAdmin', 'Admin', 'Specialist']);
  }

  canViewPrescriptions(): boolean {
    return this.hasRole(['SuperAdmin', 'Admin', 'Specialist', 'Receptionist']);
  }

  canCreatePrescriptions(): boolean {
    return this.hasRole(['SuperAdmin', 'Admin', 'Specialist']);
  }

  canViewDocuments(): boolean {
    return this.hasRole(['SuperAdmin', 'Admin', 'Specialist', 'Receptionist']);
  }

  canCaptureStudyResults(): boolean {
    return this.hasRole(['Laboratorist', 'SuperAdmin', 'Admin']);
  }

  isOnlyLaboratorist(): boolean {
    return this.isLaboratorist() && !this.hasRole(['SuperAdmin', 'Admin', 'Specialist', 'Receptionist']);
  }

  isOnlySpecialist(): boolean {
    return this.isSpecialist() && !this.isAdmin() && !this.isReceptionist();
  }

  private handleAuthSuccess(data: LoginResponseDto): void {
    const companies = data.assignedCompanies || data.companies || [];
    const roles: UserRole[] = data.roles && data.roles.length > 0
      ? data.roles
      : (data.role ? [data.role] : []);

    const employeeId = data.employeeId || data.specialistId || data.receptionistId || null;

    const session: UserSession = {
      username: data.username,
      profileName: data.profileName || null,
      roles: roles,
      role: roles[0] || 'Receptionist',
      employeeId: employeeId,
      specialistId: employeeId,
      receptionistId: employeeId,
      token: data.token,
      companyIds: companies.map(c => c.id)
    };

    localStorage.setItem(this.tokenKey, data.token);
    localStorage.setItem(this.userKey, JSON.stringify(session));

    this.token.set(data.token);
    this.currentUser.set(session);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getStoredUser(): UserSession | null {
    const stored = localStorage.getItem(this.userKey);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as UserSession;
      if (!parsed.roles && parsed.role) {
        parsed.roles = [parsed.role];
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
