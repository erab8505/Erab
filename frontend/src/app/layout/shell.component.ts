import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { CompanyContextService } from '../core/services/company-context.service';
import { ThemeService } from '../core/services/theme.service';
import { BadgeComponent } from '../shared/components/badge/badge.component';
import { ToastContainerComponent } from '../shared/components/toast/toast-container.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BadgeComponent, ToastContainerComponent],
  template: `
    <div class="app-layout">
      <!-- Top Navbar -->
      <header class="app-navbar">
        <div class="navbar-left">
          <button 
            type="button" 
            class="mobile-menu-btn" 
            (click)="toggleMobileMenu()"
            aria-label="Abrir menú de navegación">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          
          <div class="brand-logo" routerLink="/dashboard">
            <div class="brand-icon">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
              </svg>
            </div>
            <span class="brand-name">MedApp</span>
          </div>

          <!-- Active Company Pill -->
          @if (companyService.activeCompany(); as company) {
            <div class="company-pill">
              <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <span class="company-name font-medium">{{ company.name }}</span>
              <button 
                type="button" 
                class="switch-company-link" 
                (click)="switchCompany()" 
                title="Cambiar de empresa activa">
                Cambiar
              </button>
            </div>
          }
        </div>

        <div class="navbar-right">
          <!-- Theme Toggle -->
          <button 
            type="button" 
            class="nav-icon-btn" 
            (click)="themeService.toggleTheme()"
            [title]="themeService.theme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            aria-label="Alternar tema de interfaz">
            @if (themeService.theme() === 'dark') {
              <!-- Sun -->
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            } @else {
              <!-- Moon -->
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            }
          </button>

          <!-- User Profile & Role -->
          <div class="user-profile-badge">
            <div class="user-avatar">{{ userInitials() }}</div>
            <div class="user-info hidden sm:flex flex-col">
              <span class="user-name">{{ authService.username() }}</span>
              <app-badge [variant]="roleBadgeVariant" [text]="roleLabel"></app-badge>
            </div>
          </div>

          <!-- Logout Button -->
          <button 
            type="button" 
            class="logout-btn" 
            (click)="authService.logout()"
            title="Cerrar sesión"
            aria-label="Cerrar sesión">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="hidden md:inline">Salir</span>
          </button>
        </div>
      </header>

      <div class="app-body">
        <!-- Sidebar -->
        <aside class="app-sidebar" [class.mobile-open]="mobileMenuOpen()">
          <nav class="sidebar-nav">
            <div class="nav-section-label">General</div>
            <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>Inicio</span>
            </a>

            <div class="nav-section-label">Clínica y Operaciones</div>
            <a routerLink="/patients" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span>Pacientes</span>
            </a>

            <a routerLink="/scheduling" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>Agenda y Citas</span>
            </a>

            <!-- Admin Only Section -->
            @if (authService.isAdmin()) {
              <div class="nav-section-label">Administración</div>
              <a routerLink="/companies" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span>Empresas</span>
              </a>

              <a routerLink="/areas" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                <span>Áreas</span>
              </a>

              <a routerLink="/specialties" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>Especialidades</span>
              </a>

              <a routerLink="/specialists" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span>Especialistas</span>
              </a>

              <a routerLink="/interventions" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
                <span>Procedimientos</span>
              </a>

              <a routerLink="/users" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                <span>Usuarios</span>
              </a>
            }
          </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="app-main">
          <router-outlet></router-outlet>
        </main>
      </div>

      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-main, #f8fafc);
      color: var(--text-color, #0f172a);
    }
    .app-navbar {
      height: 4rem;
      background-color: var(--card-bg, #ffffff);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 30;
    }
    .navbar-left, .navbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .mobile-menu-btn {
      display: none;
      background: transparent;
      border: none;
      color: var(--text-color, #0f172a);
      cursor: pointer;
      padding: 0.25rem;
    }
    @media (max-width: 768px) {
      .mobile-menu-btn { display: flex; }
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      cursor: pointer;
      text-decoration: none;
    }
    .brand-icon {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--radius-lg, 0.75rem);
      background: var(--primary-color, #006194);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px var(--primary-glow, rgba(0, 97, 148, 0.25));
    }
    .brand-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary-color, #006194);
      letter-spacing: -0.03em;
    }
    .company-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--card-footer-bg, #eff4ff);
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-full, 9999px);
      font-size: 0.8125rem;
      border: 1px solid var(--border-color, #dce9ff);
    }
    .switch-company-link {
      background: transparent;
      border: none;
      color: var(--secondary-color, #006a61);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding-left: 0.375rem;
      border-left: 1px solid var(--border-input, #bfc7d2);
    }
    .switch-company-link:hover {
      text-decoration: underline;
    }
    .nav-icon-btn {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--radius-lg, 0.75rem);
      border: 1px solid var(--border-color, #dce9ff);
      background: var(--card-bg, #ffffff);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s;
    }
    .nav-icon-btn:hover {
      background: var(--bg-hover, #e5eeff);
    }
    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      background: var(--card-footer-bg, #eff4ff);
      padding: 0.25rem 0.75rem 0.25rem 0.25rem;
      border-radius: var(--radius-full, 9999px);
      border: 1px solid var(--border-color, #dce9ff);
    }
    .user-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 9999px;
      background: var(--primary-color, #006194);
      color: white;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px var(--primary-glow);
    }
    .user-name {
      font-size: 0.8125rem;
      font-weight: 600;
      line-height: 1.2;
    }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-md, 0.5rem);
      border: 1px solid var(--border-color, #dce9ff);
      background: var(--card-bg, #ffffff);
      color: var(--danger-color, #ba1a1a);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.15s;
    }
    .logout-btn:hover {
      background: var(--danger-light, #ffdad6);
      border-color: var(--danger-color, #ba1a1a);
    }
    :host-context(.dark) .logout-btn:hover {
      background: rgba(186, 26, 26, 0.18);
      border-color: var(--danger-color);
    }
    .app-body {
      display: flex;
      flex: 1;
    }
    .app-sidebar {
      width: 16.5rem;
      background: var(--card-bg, #ffffff);
      border-right: 1px solid var(--border-color, #dce9ff);
      padding: 1.25rem 0.875rem;
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 768px) {
      .app-sidebar {
        position: fixed;
        top: 4rem;
        bottom: 0;
        left: -16.5rem;
        z-index: 40;
        transition: left 0.2s ease-in-out;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
      .app-sidebar.mobile-open {
        left: 0;
      }
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .nav-section-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted, #545c72);
      padding: 0.75rem 0.75rem 0.25rem 0.75rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-lg, 0.75rem);
      color: var(--text-muted, #545c72);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .nav-item:hover {
      background-color: var(--bg-hover, #e5eeff);
      color: var(--text-color, #0b1c30);
    }
    .nav-item.active {
      background-color: var(--primary-container, #007bb9);
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 2px 4px var(--primary-glow);
    }
    :host-context(.dark) .nav-item.active {
      background-color: var(--primary-container, #004b73);
      color: #ffffff;
    }
    .app-main {
      flex: 1;
      padding: 1.75rem 2rem;
      max-width: 100%;
      overflow-x: hidden;
    }
  `]
})
export class ShellComponent {
  readonly authService = inject(AuthService);
  readonly companyService = inject(CompanyContextService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly mobileMenuOpen = signal<boolean>(false);

  readonly userInitials = computed(() => {
    const name = this.authService.username() || 'U';
    return name.substring(0, 2).toUpperCase();
  });

  get roleLabel(): string {
    const role = this.authService.userRole();
    switch (role) {
      case 'Admin': return 'Administrador';
      case 'Specialist': return 'Especialista';
      case 'Receptionist': return 'Recepcionista';
      default: return 'Usuario';
    }
  }

  get roleBadgeVariant(): 'primary' | 'success' | 'warning' | 'info' {
    const role = this.authService.userRole();
    switch (role) {
      case 'Admin': return 'primary';
      case 'Specialist': return 'info';
      case 'Receptionist': return 'success';
      default: return 'warning';
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  switchCompany(): void {
    this.router.navigate(['/select-company']);
  }
}
