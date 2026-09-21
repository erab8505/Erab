import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { CompanyContextService } from '../../core/services/company-context.service';
import { AreaDto, CompanyDto, InterventionTypeDto, PatientDto, SchedulingDto, SpecialistDto, SpecialtyDto, UserDto, ApiResponse } from '../../core/models/models';

interface AdminStats {
  areasCount: number;
  specialtiesCount: number;
  specialistsCount: number;
  interventionsCount: number;
  patientsCount: number;
  usersCount: number;
}

interface TreeSpecialty extends SpecialtyDto {
  specialists: SpecialistDto[];
  interventions: InterventionTypeDto[];
  expanded?: boolean;
}

interface TreeArea extends AreaDto {
  specialties: TreeSpecialty[];
  expanded?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="text-2xl font-bold">Panel Principal</h1>
          <p class="text-slate-500 text-sm mt-1">
            Empresa activa: <b class="text-blue-600 dark:text-blue-400">{{ companyService.activeCompanyName() }}</b>
          </p>
        </div>
        <div class="header-actions">
          @if (authService.isAdmin()) {
            <a routerLink="/companies" class="btn btn-secondary">Gestionar Empresas</a>
          }
          <a routerLink="/scheduling" class="btn btn-primary">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nueva Cita
          </a>
        </div>
      </div>

      <!-- ADMIN DASHBOARD VIEW -->
      @if (authService.isAdmin()) {      
        <!-- Organization Tree Section -->
        <div class="card p-5 mt-6">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 class="text-lg font-semibold m-0">Estructura Organizacional</h2>
              <p class="text-xs text-slate-500 m-0">Árbol de Áreas &gt; Especialidades &gt; Especialistas y Procedimientos</p>
            </div>
            <button class="btn btn-secondary text-xs" (click)="toggleAllTree()">
              {{ allExpanded() ? 'Contraer Todo' : 'Expandir Todo' }}
            </button>
          </div>

          @if (treeLoading()) {
            <div class="p-8 text-center text-slate-500">
              <span class="spinner-sm"></span>
              <span class="ml-2">Cargando jerarquía médica...</span>
            </div>
          } @else if (treeAreas().length === 0) {
            <div class="p-8 text-center text-slate-400">
              <p>No hay áreas ni especialidades configuradas en esta empresa.</p>
              <a routerLink="/areas" class="btn btn-primary mt-2">Crear Primera Área</a>
            </div>
          } @else {
            <div class="tree-container">
              @for (area of treeAreas(); track area.id) {
                <div class="tree-node area-node">
                  <div class="node-header cursor-pointer" (click)="toggleArea(area)">
                    <span class="expand-icon">{{ area.expanded ? '▼' : '►' }}</span>
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <span class="node-title font-semibold">{{ area.name }}</span>
                    <span class="badge-count">{{ area.specialties.length }} especialidades</span>
                  </div>

                  @if (area.expanded) {
                    <div class="node-children">
                      @for (spec of area.specialties; track spec.id) {
                        <div class="tree-node specialty-node">
                          <div class="node-header cursor-pointer" (click)="toggleSpecialty(spec)">
                            <span class="expand-icon text-xs">{{ spec.expanded ? '▼' : '►' }}</span>
                            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <span class="node-title font-medium">{{ spec.name }}</span>
                            <span class="badge-count">{{ spec.specialists.length }} especialistas, {{ spec.interventions.length }} procedimientos</span>
                          </div>

                          @if (spec.expanded) {
                            <div class="node-children">
                              <!-- Specialists -->
                              <div class="sub-list">
                                <span class="sub-list-title">Especialistas:</span>
                                @if (spec.specialists.length === 0) {
                                  <span class="text-xs text-slate-400 italic">Sin especialistas vinculados</span>
                                } @else {
                                  <div class="flex flex-wrap gap-2 mt-1">
                                    @for (doc of spec.specialists; track doc.id) {
                                      <span class="pill-badge">
                                        👨‍⚕️ {{ doc.fullName }} (Lic: {{ doc.licenseNumber }})
                                      </span>
                                    }
                                  </div>
                                }
                              </div>

                              <!-- Interventions -->
                              <div class="sub-list mt-2">
                                <span class="sub-list-title">Procedimientos Médicos:</span>
                                @if (spec.interventions.length === 0) {
                                  <span class="text-xs text-slate-400 italic">Sin procedimientos configurados</span>
                                } @else {
                                  <div class="flex flex-wrap gap-2 mt-1">
                                    @for (proc of spec.interventions; track proc.id) {
                                      <span class="pill-badge secondary">
                                        🩺 {{ proc.name }} ({{ proc.durationMinutes }}m)
                                      </span>
                                    }
                                  </div>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      } @else {

        <!-- Recent Patients Section -->
        <div class="card p-5 mt-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold m-0">Pacientes Recientes</h2>
            <a routerLink="/patients" class="text-sm font-medium text-blue-600 hover:underline">Ver Directorio &rarr;</a>
          </div>

          @if (patientsList().length === 0) {
            <div class="p-8 text-center text-slate-400">
              <p>No hay pacientes registrados en esta empresa.</p>
              <a routerLink="/patients/new" class="btn btn-primary mt-2">Registrar Paciente</a>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b">
                  <tr>
                    <th class="p-3">Documento</th>
                    <th class="p-3">Paciente</th>
                    <th class="p-3">Edad / Género</th>
                    <th class="p-3">Teléfono</th>
                    <th class="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of patientsList().slice(0, 5); track p.id) {
                    <tr class="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td class="p-3 font-medium">
                        <span class="doc-pill">
                          🆔 {{ p.documentId }}
                        </span>
                      </td>
                      <td class="p-3">
                        <a [routerLink]="['/patients', p.id]" class="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                          {{ p.fullName || (p.firstName + ' ' + p.lastName) }}
                        </a>
                      </td>
                      <td class="p-3 text-slate-700 dark:text-slate-300">{{ p.age }} años ({{ p.gender }})</td>
                      <td class="p-3 text-slate-600 dark:text-slate-400">{{ p.phone || 'N/A' }}</td>
                      <td class="p-3 text-right">
                        <a [routerLink]="['/patients', p.id]" class="btn btn-secondary btn-sm">Ver Expediente</a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .stat-card {
      background: var(--card-bg, #ffffff);
      border-radius: 0.75rem;
      border: 1px solid var(--border-color, #e2e8f0);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-label {
      display: block;
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      font-weight: 500;
    }
    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color, #0f172a);
      line-height: 1.2;
    }
    .tree-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .tree-node {
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.5rem;
      background: var(--card-bg, #ffffff);
    }
    .node-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      user-select: none;
    }
    .node-header:hover {
      background-color: var(--bg-hover, #f8fafc);
    }
    .expand-icon {
      font-size: 0.75rem;
      color: #94a3b8;
      width: 1rem;
    }
    .badge-count {
      margin-left: auto;
      font-size: 0.75rem;
      color: #64748b;
      background: var(--bg-hover, #f1f5f9);
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }
    .node-children {
      padding: 0.5rem 1rem 1rem 2.25rem;
      border-top: 1px solid var(--border-color, #f1f5f9);
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    .sub-list-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    .pill-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.625rem;
      border-radius: 0.375rem;
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #dbeafe;
    }
    .pill-badge.secondary {
      background: #f0fdf4;
      color: #166534;
      border-color: #dcfce7;
    }
    :host-context(.dark) .pill-badge {
      background: rgba(30, 64, 175, 0.2);
      color: #93c5fd;
      border-color: #1e40af;
    }
    :host-context(.dark) .pill-badge.secondary {
      background: rgba(22, 101, 52, 0.2);
      color: #86efac;
      border-color: #166534;
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly companyService = inject(CompanyContextService);
  private readonly http = inject(HttpClient);

  readonly stats = signal<AdminStats>({
    areasCount: 0,
    specialtiesCount: 0,
    specialistsCount: 0,
    interventionsCount: 0,
    patientsCount: 0,
    usersCount: 0
  });

  readonly treeLoading = signal<boolean>(true);
  readonly treeAreas = signal<TreeArea[]>([]);
  readonly allExpanded = signal<boolean>(true);

  readonly patientsList = signal<PatientDto[]>([]);
  readonly todayAppointmentsCount = signal<number>(0);

  readonly patientMetrics = signal({
    total: 0,
    male: 0,
    female: 0
  });

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadAdminData();
    } else {
      this.loadClinicalData();
    }
  }

  loadAdminData(): void {
    this.treeLoading.set(true);
    forkJoin({
      areas: this.http.get<ApiResponse<AreaDto[]>>(`${environment.apiUrl}/areas`),
      specialties: this.http.get<ApiResponse<SpecialtyDto[]>>(`${environment.apiUrl}/specialties`),
      specialists: this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/specialists`),
      interventions: this.http.get<ApiResponse<InterventionTypeDto[]>>(`${environment.apiUrl}/intervention-types`),
      patients: this.http.get<ApiResponse<PatientDto[]>>(`${environment.apiUrl}/patients`),
      users: this.http.get<ApiResponse<UserDto[]>>(`${environment.apiUrl}/users`)
    }).subscribe({
      next: (res) => {
        this.treeLoading.set(false);

        const areas = res.areas.data || [];
        const specialties = res.specialties.data || [];
        const specialists = res.specialists.data || [];
        const interventions = res.interventions.data || [];
        const patients = res.patients.data || [];
        const users = res.users.data || [];

        this.stats.set({
          areasCount: areas.length,
          specialtiesCount: specialties.length,
          specialistsCount: specialists.length,
          interventionsCount: interventions.length,
          patientsCount: patients.length,
          usersCount: users.length
        });

        // Assemble Tree
        const assembledTree: TreeArea[] = areas.map(area => {
          const areaSpecs = specialties.filter(s => s.areaId === area.id).map(spec => ({
            ...spec,
            specialists: specialists.filter(sp => sp.specialtyId === spec.id),
            interventions: interventions.filter(it => it.specialtyId === spec.id),
            expanded: true
          }));

          return {
            ...area,
            specialties: areaSpecs,
            expanded: true
          };
        });

        this.treeAreas.set(assembledTree);
      },
      error: () => this.treeLoading.set(false)
    });
  }

  loadClinicalData(): void {
    forkJoin({
      patients: this.http.get<ApiResponse<PatientDto[]>>(`${environment.apiUrl}/patients`),
      schedulings: this.http.get<ApiResponse<SchedulingDto[]>>(`${environment.apiUrl}/scheduling`)
    }).subscribe({
      next: (res) => {
        const patients = (res.patients.data || []).map(p => ({
          ...p,
          fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim()
        }));
        const schedulings = res.schedulings.data || [];

        this.patientsList.set(patients);
        this.patientMetrics.set({
          total: patients.length,
          male: patients.filter(p => p.gender === 'M').length,
          female: patients.filter(p => p.gender === 'F').length
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const todayCount = schedulings.filter(s => s.scheduledAt.startsWith(todayStr)).length;
        this.todayAppointmentsCount.set(todayCount);
      }
    });
  }

  toggleArea(area: TreeArea): void {
    area.expanded = !area.expanded;
  }

  toggleSpecialty(spec: TreeSpecialty): void {
    spec.expanded = !spec.expanded;
  }

  toggleAllTree(): void {
    const nextState = !this.allExpanded();
    this.allExpanded.set(nextState);
    this.treeAreas.update(areas =>
      areas.map(a => ({
        ...a,
        expanded: nextState,
        specialties: a.specialties.map(s => ({ ...s, expanded: nextState }))
      }))
    );
  }
}
