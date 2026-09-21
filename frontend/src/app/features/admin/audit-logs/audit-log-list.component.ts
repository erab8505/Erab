import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, AuditLogDto, PagedAuditLogsDto, UserRole } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Registro de Auditoría y Trazabilidad</h1>
          <p class="text-slate-500 text-sm">Monitoreo y trazabilidad cronológica de acciones ejecutadas por cada usuario y rol</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" (click)="refresh()">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Actualizar
        </button>
      </div>

      <!-- Filter Controls Bar -->
      <div class="filter-card">
        <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div class="form-group">
            <label class="form-label text-xs">Rol de Usuario</label>
            <select formControlName="role" class="form-select text-xs">
              <option value="">Todos los Roles</option>
              <option value="SuperAdmin">👑 Super Admin</option>
              <option value="Admin">🛡️ Admin</option>
              <option value="Receptionist">📋 Recepcionista</option>
              <option value="Specialist">🩺 Especialista</option>
              <option value="Laboratorist">🔬 Laboratorista</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label text-xs">Módulo</label>
            <select formControlName="module" class="form-select text-xs">
              <option value="">Todos los Módulos</option>
              @for (mod of availableModules(); track mod) {
                <option [value]="mod">{{ mod }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label text-xs">Acción</label>
            <select formControlName="action" class="form-select text-xs">
              <option value="">Todas las Acciones</option>
              @for (act of availableActions(); track act) {
                <option [value]="act">{{ act }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label text-xs">Desde</label>
            <input type="date" formControlName="fromDate" class="form-control text-xs" />
          </div>

          <div class="form-group">
            <label class="form-label text-xs">Hasta</label>
            <input type="date" formControlName="toDate" class="form-control text-xs" />
          </div>

          <div class="form-group flex items-end gap-1.5">
            <button type="submit" class="btn btn-primary btn-sm flex-1">
              Filtrar
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="resetFilters()" title="Limpiar filtros">
              ✕
            </button>
          </div>
        </form>

        <div class="mt-3">
          <input 
            type="text" 
            [formControl]="searchControl" 
            class="form-control text-xs" 
            placeholder="🔍 Buscar por usuario, descripción o identificador en tiempo real..." />
        </div>
      </div>

      <!-- Audit Logs Table / Feed -->
      <div class="table-container">
        @if (loading()) {
          <div class="p-8 text-center text-slate-500">
            <span class="spinner-sm inline-block mr-2"></span>
            Cargando registros de auditoría...
          </div>
        } @else if (logs().length === 0) {
          <div class="p-10 text-center text-slate-500">
            <div class="text-3xl mb-2">📜</div>
            <div class="font-medium text-slate-700 dark:text-slate-300">No se encontraron eventos de auditoría</div>
            <div class="text-xs text-slate-400 mt-1">Intente cambiar los filtros o el rango de fechas.</div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 150px;">Fecha y Hora</th>
                  <th style="width: 170px;">Usuario & Rol</th>
                  <th style="width: 130px;">Módulo</th>
                  <th style="width: 120px;">Acción</th>
                  <th>Descripción del Evento</th>
                  <th style="width: 80px;" class="text-right">Detalles</th>
                </tr>
              </thead>
              <tbody>
                @for (log of logs(); track log.id) {
                  <tr>
                    <td>
                      <div class="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {{ log.createdAt | date:'shortDate' }}
                      </div>
                      <div class="text-xs text-slate-500">
                        {{ log.createdAt | date:'mediumTime' }}
                      </div>
                    </td>

                    <td>
                      <div class="flex items-center gap-2">
                        <div class="user-mini-avatar" [ngClass]="getAvatarRoleClass(log.userRole)">
                          {{ (log.username || 'U').substring(0, 2).toUpperCase() }}
                        </div>
                        <div class="min-w-0">
                          <div class="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                            {{ log.username }}
                          </div>
                          <span class="text-[10px] px-1.5 py-0.2 rounded font-medium" [ngClass]="getRolePillClass(log.userRole)">
                            {{ getRoleLabel(log.userRole) }}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span class="module-chip">{{ log.module }}</span>
                    </td>

                    <td>
                      <span class="action-chip" [ngClass]="getActionClass(log.action)">
                        {{ log.action }}
                      </span>
                    </td>

                    <td>
                      <div class="text-xs text-slate-800 dark:text-slate-200">
                        {{ log.description }}
                      </div>
                      @if (log.companyName) {
                        <div class="text-[11px] text-slate-400 mt-0.5">
                          🏢 {{ log.companyName }}
                        </div>
                      }
                    </td>

                    <td class="text-right">
                      @if (log.detailsJson) {
                        <button type="button" class="btn btn-secondary btn-xs" (click)="viewDetails(log)">
                          Ver JSON
                        </button>
                      } @else {
                        <span class="text-slate-400 text-xs">-</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="pagination-bar">
            <div class="text-xs text-slate-500">
              Mostrando {{ logs().length }} de {{ totalCount() }} registros (Página {{ pageNumber() }} de {{ totalPages() }})
            </div>
            <div class="flex items-center gap-1.5">
              <button 
                type="button" 
                class="btn btn-secondary btn-sm" 
                [disabled]="pageNumber() <= 1 || loading()"
                (click)="goToPage(pageNumber() - 1)">
                ← Anterior
              </button>
              <button 
                type="button" 
                class="btn btn-secondary btn-sm" 
                [disabled]="pageNumber() >= totalPages() || loading()"
                (click)="goToPage(pageNumber() + 1)">
                Siguiente →
              </button>
            </div>
          </div>
        }
      </div>

      <!-- JSON Details Modal -->
      <app-modal 
        [isOpen]="detailModalOpen()" 
        title="Detalle Técnico del Evento de Auditoría" 
        size="lg"
        (closed)="detailModalOpen.set(false)">
        @if (selectedLog(); as item) {
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div><span class="text-slate-500">Usuario:</span> <strong>{{ item.username }}</strong> ({{ item.userRole }})</div>
              <div><span class="text-slate-500">Fecha/Hora:</span> <strong>{{ item.createdAt | date:'medium' }}</strong></div>
              <div><span class="text-slate-500">Módulo:</span> <strong>{{ item.module }}</strong></div>
              <div><span class="text-slate-500">Acción:</span> <strong>{{ item.action }}</strong></div>
              @if (item.entityId) {
                <div class="col-span-2"><span class="text-slate-500">ID Entidad:</span> <code>{{ item.entityId }}</code></div>
              }
            </div>

            <div class="form-group">
              <label class="form-label text-xs">Carga de Datos (JSON)</label>
              <pre class="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs overflow-x-auto font-mono max-h-72">{{ formattedJson() }}</pre>
            </div>
          </div>
        }
        <div modal-footer>
          <button type="button" class="btn btn-secondary" (click)="detailModalOpen.set(false)">Cerrar</button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .filter-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 0.75rem);
      padding: 1rem;
    }
    .table-container {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 0.75rem);
      overflow: hidden;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .data-table th {
      background: var(--bg-hover, #f8fafc);
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .data-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      vertical-align: middle;
    }
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-hover, #f8fafc);
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .user-mini-avatar {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #ffffff;
      flex-shrink: 0;
    }
    .avatar-superadmin { background: linear-gradient(135deg, #7c3aed, #b45309); }
    .avatar-admin { background: linear-gradient(135deg, #1d4ed8, #0284c7); }
    .avatar-specialist { background: linear-gradient(135deg, #0d9488, #059669); }
    .avatar-laboratorist { background: linear-gradient(135deg, #d97706, #ea580c); }
    .avatar-receptionist { background: linear-gradient(135deg, #0284c7, #06b6d4); }
    .avatar-default { background: #64748b; }

    .role-pill-superadmin { background: #f3e8ff; color: #6b21a8; }
    .role-pill-admin { background: #eff6ff; color: #1e40af; }
    .role-pill-specialist { background: #f0fdf4; color: #166534; }
    .role-pill-laboratorist { background: #fffbeb; color: #92400e; }
    .role-pill-receptionist { background: #ecfeff; color: #155e75; }
    .role-pill-default { background: #f1f5f9; color: #475569; }

    .module-chip {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: 0.25rem;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .action-chip {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
    }
    .action-create { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .action-update { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
    .action-delete { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .action-status { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .action-default { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .btn-xs { padding: 0.2rem 0.45rem; font-size: 0.6875rem; border-radius: 0.375rem; }
  `]
})
export class AuditLogListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly logs = signal<AuditLogDto[]>([]);
  readonly availableModules = signal<string[]>([]);
  readonly availableActions = signal<string[]>([]);
  readonly loading = signal<boolean>(true);
  readonly totalCount = signal<number>(0);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(50);
  readonly totalPages = signal<number>(1);

  readonly detailModalOpen = signal<boolean>(false);
  readonly selectedLog = signal<AuditLogDto | null>(null);

  readonly filterForm: FormGroup = this.fb.group({
    role: [''],
    module: [''],
    action: [''],
    fromDate: [''],
    toDate: ['']
  });

  readonly searchControl = this.fb.control('');

  ngOnInit(): void {
    this.loadFilterCatalogs();
    this.loadData();

    this.searchControl.valueChanges.subscribe(() => {
      this.pageNumber.set(1);
      this.loadData();
    });
  }

  loadFilterCatalogs(): void {
    this.http.get<ApiResponse<string[]>>(`${environment.apiUrl}/audit-logs/modules`).subscribe({
      next: (res) => this.availableModules.set(res.data || [])
    });
    this.http.get<ApiResponse<string[]>>(`${environment.apiUrl}/audit-logs/actions`).subscribe({
      next: (res) => this.availableActions.set(res.data || [])
    });
  }

  loadData(): void {
    this.loading.set(true);
    let params = new HttpParams()
      .set('pageNumber', this.pageNumber().toString())
      .set('pageSize', this.pageSize().toString());

    const formVal = this.filterForm.value;
    if (formVal.role) params = params.set('role', formVal.role);
    if (formVal.module) params = params.set('module', formVal.module);
    if (formVal.action) params = params.set('action', formVal.action);
    if (formVal.fromDate) params = params.set('fromDate', formVal.fromDate);
    if (formVal.toDate) params = params.set('toDate', formVal.toDate);

    const search = this.searchControl.value;
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    this.http.get<ApiResponse<PagedAuditLogsDto>>(`${environment.apiUrl}/audit-logs`, { params }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data) {
          this.logs.set(res.data.items || []);
          this.totalCount.set(res.data.totalCount || 0);
          this.totalPages.set(res.data.totalPages || 1);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadData();
  }

  resetFilters(): void {
    this.filterForm.reset({
      role: '',
      module: '',
      action: '',
      fromDate: '',
      toDate: ''
    });
    this.searchControl.setValue('');
    this.pageNumber.set(1);
    this.loadData();
  }

  refresh(): void {
    this.loadData();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageNumber.set(page);
      this.loadData();
    }
  }

  viewDetails(log: AuditLogDto): void {
    this.selectedLog.set(log);
    this.detailModalOpen.set(true);
  }

  formattedJson(): string {
    const raw = this.selectedLog()?.detailsJson;
    if (!raw) return '{}';
    try {
      const obj = JSON.parse(raw);
      return JSON.stringify(obj, null, 2);
    } catch {
      return raw;
    }
  }

  getAvatarRoleClass(role: UserRole): string {
    switch (role) {
      case 'SuperAdmin': return 'avatar-superadmin';
      case 'Admin': return 'avatar-admin';
      case 'Specialist': return 'avatar-specialist';
      case 'Laboratorist': return 'avatar-laboratorist';
      case 'Receptionist': return 'avatar-receptionist';
      default: return 'avatar-default';
    }
  }

  getRolePillClass(role: UserRole): string {
    switch (role) {
      case 'SuperAdmin': return 'role-pill-superadmin';
      case 'Admin': return 'role-pill-admin';
      case 'Specialist': return 'role-pill-specialist';
      case 'Laboratorist': return 'role-pill-laboratorist';
      case 'Receptionist': return 'role-pill-receptionist';
      default: return 'role-pill-default';
    }
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'SuperAdmin': return 'SuperAdmin';
      case 'Admin': return 'Admin';
      case 'Specialist': return 'Especialista';
      case 'Laboratorist': return 'Laboratorista';
      case 'Receptionist': return 'Recepcionista';
      default: return role;
    }
  }

  getActionClass(action: string): string {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('SAVE')) return 'action-create';
    if (act.includes('UPDATE') || act.includes('RESCHEDULE')) return 'action-update';
    if (act.includes('DELETE') || act.includes('CANCEL')) return 'action-delete';
    if (act.includes('STATUS')) return 'action-status';
    return 'action-default';
  }
}
