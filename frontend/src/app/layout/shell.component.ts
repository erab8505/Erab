import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { CompanyContextService } from '../core/services/company-context.service';
import { ThemeService } from '../core/services/theme.service';
import { UserRole } from '../core/models/models';
import { ToastContainerComponent } from '../shared/components/toast/toast-container.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
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
            <span class="brand-name">EraB</span>
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
          <div class="user-profile-badge" [title]="'Perfil: ' + authService.displayName() + (authService.profileName() ? ' (@' + authService.username() + ')' : '') + ' • ' + roleLabel">
            <div class="user-avatar" [ngClass]="avatarRoleClass">
              {{ userInitials() }}
            </div>
            <div class="user-info">
              <div class="user-name-line">
                <span class="user-name">{{ authService.displayName() }}</span>
              </div>
              <span class="user-role-badge" [ngClass]="rolePillClass">{{ roleLabel }}</span>
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
        <!-- Mobile Sidebar Backdrop Overlay -->
        @if (mobileMenuOpen()) {
          <div 
            class="sidebar-backdrop" 
            (click)="closeMobileMenu()" 
            aria-hidden="true">
          </div>
        }

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

            @if (authService.canAccessScheduling()) {
              <a routerLink="/scheduling" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>Agenda y Citas</span>
              </a>
            }

            <a routerLink="/studies" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
              <span>Estudios y Laboratorio</span>
            </a>

            <!-- Admin Only Section -->
            @if (authService.isAdmin()) {
              <div class="nav-section-label">Administración</div>
              <a routerLink="/studies/catalog" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
                <span>Catálogo de Estudios</span>
              </a>

              @if (authService.isSuperAdmin()) {
                <a routerLink="/companies" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  <span>Empresas</span>
                </a>
              }

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

              <a routerLink="/employees" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>Empleados</span>
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

              <a routerLink="/audit-logs" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
                <span>Trazabilidad / Auditoría</span>
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
      padding: 0 1rem;
      position: sticky;
      top: 0;
      z-index: 30;
    }
    @media (min-width: 768px) {
      .app-navbar { padding: 0 1.5rem; }
    }
    .navbar-left, .navbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    @media (min-width: 640px) {
      .navbar-left, .navbar-right { gap: 0.875rem; }
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
      gap: 0.5rem;
      cursor: pointer;
      text-decoration: none;
    }
    .brand-icon {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-lg, 0.75rem);
      background: var(--primary-color, #006194);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px var(--primary-glow, rgba(0, 97, 148, 0.25));
    }
    @media (min-width: 640px) {
      .brand-icon { width: 2.25rem; height: 2.25rem; }
    }
    .brand-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--primary-color, #006194);
      letter-spacing: -0.03em;
    }
    @media (min-width: 640px) {
      .brand-name { font-size: 1.25rem; }
    }
    .company-pill {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--card-footer-bg, #eff4ff);
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-full, 9999px);
      font-size: 0.75rem;
      border: 1px solid var(--border-color, #dce9ff);
      max-width: 140px;
    }
    @media (min-width: 640px) {
      .company-pill {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
        max-width: 220px;
        gap: 0.5rem;
      }
    }
    .company-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .switch-company-link {
      background: transparent;
      border: none;
      color: var(--secondary-color, #006a61);
      font-size: 0.6875rem;
      font-weight: 600;
      cursor: pointer;
      padding-left: 0.375rem;
      border-left: 1px solid var(--border-input, #bfc7d2);
      flex-shrink: 0;
    }
    @media (min-width: 640px) {
      .switch-company-link { font-size: 0.75rem; }
    }
    .switch-company-link:hover {
      text-decoration: underline;
    }
    .nav-icon-btn {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-lg, 0.75rem);
      border: 1px solid var(--border-color, #dce9ff);
      background: var(--card-bg, #ffffff);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s;
    }
    @media (min-width: 640px) {
      .nav-icon-btn { width: 2.25rem; height: 2.25rem; }
    }
    .nav-icon-btn:hover {
      background: var(--bg-hover, #e5eeff);
    }
    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      background: var(--card-bg, #ffffff);
      padding: 0.25rem 0.75rem 0.25rem 0.35rem;
      border-radius: var(--radius-full, 9999px);
      border: 1.5px solid var(--border-color, #dce9ff);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }
    :host-context(.dark) .user-profile-badge {
      background: #1e293b;
      border-color: #334155;
    }
    .user-profile-badge:hover {
      border-color: var(--primary-color, #006194);
      box-shadow: 0 2px 8px rgba(0, 97, 148, 0.15);
    }
    .user-avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 9999px;
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 800;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    }
    .avatar-superadmin {
      background: linear-gradient(135deg, #7c3aed 0%, #b45309 100%);
      box-shadow: 0 0 10px rgba(124, 58, 237, 0.35);
    }
    .avatar-admin {
      background: linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%);
      box-shadow: 0 0 10px rgba(29, 78, 216, 0.35);
    }
    .avatar-specialist {
      background: linear-gradient(135deg, #0d9488 0%, #059669 100%);
      box-shadow: 0 0 10px rgba(13, 148, 136, 0.35);
    }
    .avatar-laboratorist {
      background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
      box-shadow: 0 0 10px rgba(217, 119, 6, 0.35);
    }
    .avatar-receptionist {
      background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
      box-shadow: 0 0 10px rgba(2, 132, 199, 0.35);
    }
    .avatar-default {
      background: #64748b;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }
    .user-name-line {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-color, #0f172a);
      line-height: 1.15;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 110px;
    }
    @media (min-width: 640px) {
      .user-name { max-width: 170px; }
    }
    :host-context(.dark) .user-name {
      color: #f8fafc;
    }
    .user-role-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.6875rem;
      font-weight: 700;
      line-height: 1;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      white-space: nowrap;
      width: fit-content;
    }
    .role-pill-superadmin {
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #d8b4fe;
    }
    :host-context(.dark) .role-pill-superadmin {
      background: rgba(107, 33, 168, 0.25);
      color: #d8b4fe;
      border-color: rgba(216, 180, 254, 0.3);
    }
    .role-pill-admin {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    :host-context(.dark) .role-pill-admin {
      background: rgba(30, 64, 175, 0.25);
      color: #93c5fd;
      border-color: rgba(147, 197, 253, 0.3);
    }
    .role-pill-specialist {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    :host-context(.dark) .role-pill-specialist {
      background: rgba(22, 101, 52, 0.25);
      color: #86efac;
      border-color: rgba(134, 239, 172, 0.3);
    }
    .role-pill-laboratorist {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    :host-context(.dark) .role-pill-laboratorist {
      background: rgba(146, 64, 14, 0.25);
      color: #fcd34d;
      border-color: rgba(252, 211, 77, 0.3);
    }
    .role-pill-receptionist {
      background: #ecfeff;
      color: #155e75;
      border: 1px solid #a5f3fc;
    }
    :host-context(.dark) .role-pill-receptionist {
      background: rgba(21, 94, 117, 0.25);
      color: #67e8f9;
      border-color: rgba(103, 232, 249, 0.3);
    }
    .role-pill-default {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      border-radius: var(--radius-md, 0.5rem);
      border: 1px solid var(--border-color, #dce9ff);
      background: var(--card-bg, #ffffff);
      color: var(--danger-color, #ba1a1a);
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 600;
      transition: all 0.15s;
    }
    @media (min-width: 640px) {
      .logout-btn { padding: 0.4rem 0.75rem; font-size: 0.875rem; }
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
      position: relative;
    }
    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      z-index: 35;
      animation: fadeIn 0.15s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
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
        transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
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
      padding: 1rem 0.75rem;
      max-width: 100%;
      overflow-x: hidden;
    }
    @media (min-width: 640px) {
      .app-main { padding: 1.25rem 1.25rem; }
    }
    @media (min-width: 1024px) {
      .app-main { padding: 1.75rem 2rem; }
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
    const name = this.authService.displayName() || this.authService.username() || 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  get avatarRoleClass(): string {
    const role = this.authService.userRole();
    switch (role) {
      case 'SuperAdmin': return 'avatar-superadmin';
      case 'Admin': return 'avatar-admin';
      case 'Specialist': return 'avatar-specialist';
      case 'Laboratorist': return 'avatar-laboratorist';
      case 'Receptionist': return 'avatar-receptionist';
      default: return 'avatar-default';
    }
  }

  get rolePillClass(): string {
    const role = this.authService.userRole();
    switch (role) {
      case 'SuperAdmin': return 'role-pill-superadmin';
      case 'Admin': return 'role-pill-admin';
      case 'Specialist': return 'role-pill-specialist';
      case 'Laboratorist': return 'role-pill-laboratorist';
      case 'Receptionist': return 'role-pill-receptionist';
      default: return 'role-pill-default';
    }
  }

  get roleLabel(): string {
    const roles = this.authService.roles();
    if (roles.length === 0) return 'Usuario';
    return roles.map(r => this.getRoleName(r)).join(' • ');
  }

  private getRoleName(role: UserRole): string {
    switch (role) {
      case 'SuperAdmin': return '👑 Super Admin';
      case 'Admin': return '🛡️ Administrador';
      case 'Specialist': return '🩺 Especialista';
      case 'Laboratorist': return '🔬 Laboratorio';
      case 'Receptionist': return '📋 Recepcionista';
      default: return role;
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
