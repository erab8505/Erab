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
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly specialistId = computed(() => this.currentUser()?.specialistId ?? null);
  readonly username = computed(() => this.currentUser()?.username ?? '');

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

  hasRole(roles: UserRole[]): boolean {
    const current = this.userRole();
    return current ? roles.includes(current) : false;
  }

  isAdmin(): boolean {
    return this.userRole() === 'Admin';
  }

  isSpecialist(): boolean {
    return this.userRole() === 'Specialist';
  }

  isReceptionist(): boolean {
    return this.userRole() === 'Receptionist';
  }

  private handleAuthSuccess(data: LoginResponseDto): void {
    const companies = data.assignedCompanies || data.companies || [];
    const session: UserSession = {
      username: data.username,
      role: data.role,
      specialistId: data.specialistId,
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
      return JSON.parse(stored) as UserSession;
    } catch {
      return null;
    }
  }
}
