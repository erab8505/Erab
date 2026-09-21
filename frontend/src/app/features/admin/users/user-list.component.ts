import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, CompanyDto, SpecialistDto, UserDto, UserRole } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Gestión de Usuarios y Roles</h1>
          <p class="text-slate-500 text-sm">Control de acceso multi-empresa, roles y perfiles vinculados</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <app-data-table 
        [data]="users()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por usuario o perfil especialista...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('role') {
              <app-badge [variant]="getRoleVariant(item.role)" [text]="getRoleLabel(item.role)"></app-badge>
            }
            @case ('specialistName') {
              <span class="text-slate-700 dark:text-slate-300">
                {{ item.specialistName ? '👨‍⚕️ ' + item.specialistName : 'Ninguno' }}
              </span>
            }
            @case ('companies') {
              @if (item.role === 'SuperAdmin') {
                <span class="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium px-2 py-0.5 rounded">
                  👑 Acceso Global (Todas)
                </span>
              } @else {
                <div class="flex flex-wrap gap-1">
                  @for (c of (item.companies || []); track c.id) {
                    <span class="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                      {{ c.name }}
                    </span>
                  }
                  @if (!item.companies || item.companies.length === 0) {
                    <span class="text-xs text-slate-400 italic">Ninguna asignada</span>
                  }
                </div>
              }
            }
            @case ('createdAt') {
              <span class="text-xs text-slate-600 dark:text-slate-400">
                {{ item.createdAt | date:'mediumDate' }}
              </span>
            }
            @default {
              {{ item[col.key] || '-' }}
            }
          }
        </ng-template>

        <ng-template #actionTemplate let-item>
          <div class="flex items-center justify-end gap-2">
            <button type="button" class="btn btn-secondary btn-sm" (click)="openEditModal(item)">
              Editar
            </button>
          </div>
        </ng-template>
      </app-data-table>

      <!-- Modal Crear / Editar -->
      <app-modal 
        [isOpen]="modalOpen()" 
        [title]="editingUser() ? 'Editar Usuario' : 'Nuevo Usuario'"
        size="lg"
        (closed)="closeModal()">
        
        <form [formGroup]="form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Nombre de Usuario *</label>
              <input type="text" formControlName="username" class="form-control" placeholder="Ej. doctor_perez" />
              @if (isFieldInvalid('username')) {
                <div class="field-error">El nombre de usuario es obligatorio</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña {{ editingUser() ? '(Opcional para cambio)' : '*' }}</label>
              <input type="password" formControlName="password" class="form-control" placeholder="••••••••" />
              @if (isFieldInvalid('password')) {
                <div class="field-error">La contraseña debe tener mínimo 6 caracteres</div>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Rol del Sistema *</label>
              <select formControlName="role" class="form-select" (change)="onRoleChange()">
                @if (authService.isSuperAdmin()) {
                  <option value="SuperAdmin">👑 Super Administrador (SuperAdmin - Acceso Global)</option>
                }
                <option value="Admin">🛡️ Administrador (Admin - Por Empresa/s)</option>
                <option value="Receptionist">Recepcionista</option>
                <option value="Specialist">Especialista Médico / Odontológico</option>
                <option value="Laboratorist">Laboratorista / Personal de Laboratorio</option>
              </select>
            </div>

            @if (form.get('role')?.value === 'Specialist') {
              <div class="form-group">
                <label class="form-label">Médico / Especialista Clínico Asociado *</label>
                <select formControlName="specialistId" class="form-select">
                  <option value="">-- Seleccionar Especialista Clínico --</option>
                  @for (doc of clinicalSpecialists(); track doc.id) {
                    <option [value]="doc.id">👨‍⚕️ {{ doc.fullName }} ({{ doc.specialtyName }})</option>
                  }
                </select>
              </div>
            } @else if (form.get('role')?.value === 'Laboratorist') {
              <div class="form-group">
                <label class="form-label">Perfil de Laboratorista / Bioanalista (Opcional)</label>
                <select formControlName="specialistId" class="form-select">
                  <option value="">Sin vincular a perfil específico</option>
                  @for (doc of labSpecialists(); track doc.id) {
                    <option [value]="doc.id">🔬 {{ doc.fullName }} ({{ doc.specialtyName }})</option>
                  }
                </select>
              </div>
            } @else {
              <div class="form-group opacity-60">
                <label class="form-label">Perfil Profesional Asociado</label>
                <input type="text" class="form-control text-xs" disabled value="No requerido para este rol" />
              </div>
            }
          </div>

          <!-- Multi-Company Assignment Checkboxes -->
          @if (form.get('role')?.value === 'SuperAdmin') {
            <div class="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <span class="text-xl">👑</span>
              <div>
                <div class="font-semibold">Acceso Global Automático</div>
                <div class="text-xs">El Super Administrador tiene permiso para gestionar todas las empresas de la plataforma sin restricciones.</div>
              </div>
            </div>
          } @else {
            <div class="form-group">
              <label class="form-label">Empresas Autorizadas * (Seleccione al menos una)</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                @for (comp of companies(); track comp.id) {
                  <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      [checked]="isCompanySelected(comp.id)" 
                      (change)="toggleCompanySelection(comp.id, $event)"
                      class="w-4 h-4 text-blue-600 rounded" />
                    <span>{{ comp.name }}</span>
                  </label>
                }
              </div>
              @if (selectedCompanyIds().length === 0) {
                <div class="field-error">Debe asignar al menos una empresa al usuario.</div>
              }
            </div>
          }

          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="userActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
            <label for="userActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Usuario Activo</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button 
            type="button" 
            class="btn btn-primary" 
            [disabled]="form.invalid || (form.get('role')?.value !== 'SuperAdmin' && selectedCompanyIds().length === 0) || saving()" 
            (click)="saveUser()">
            @if (saving()) {
              <span class="spinner-sm mr-1.5"></span>
            }
            Guardar
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
  `]
})
export class UserListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly users = signal<UserDto[]>([]);
  readonly companies = signal<CompanyDto[]>([]);
  readonly specialists = signal<SpecialistDto[]>([]);
  readonly selectedCompanyIds = signal<string[]>([]);

  readonly clinicalSpecialists = computed(() => {
    return this.specialists().filter(s => {
      const spec = (s.specialtyName || '').toLowerCase();
      return !spec.includes('laboratorio') && !spec.includes('bioanálisis') && !spec.includes('patología');
    });
  });

  readonly labSpecialists = computed(() => {
    const list = this.specialists().filter(s => {
      const spec = (s.specialtyName || '').toLowerCase();
      return spec.includes('laboratorio') || spec.includes('bioanálisis') || spec.includes('patología');
    });
    return list.length > 0 ? list : this.specialists();
  });

  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingUser = signal<UserDto | null>(null);

  readonly columns: TableColumn<UserDto>[] = [
    { key: 'username', label: 'Usuario', sortable: true },
    { key: 'role', label: 'Rol', sortable: true, width: '150px' },
    { key: 'specialistName', label: 'Especialista Vinculado' },
    { key: 'companies', label: 'Empresas Asignadas' },
    { key: 'createdAt', label: 'Fecha Alta', sortable: true, width: '130px' }
  ];

  readonly form: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: [''],
    role: ['Receptionist' as UserRole, [Validators.required]],
    specialistId: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadData();
  }

  onRoleChange(): void {
    const r = this.form.get('role')?.value;
    if (r !== 'Specialist' && r !== 'Laboratorist') {
      this.form.patchValue({ specialistId: '' });
    }
  }

  loadData(): void {
    this.loading.set(true);
    const companies$ = this.authService.isSuperAdmin()
      ? this.http.get<ApiResponse<CompanyDto[]>>(`${environment.apiUrl}/companies`).pipe(
          catchError(() => of({ success: true, data: [] as CompanyDto[], message: '', errors: [] }))
        )
      : this.http.get<ApiResponse<CompanyDto[]>>(`${environment.apiUrl}/companies/mine`).pipe(
          catchError(() => of({ success: true, data: [] as CompanyDto[], message: '', errors: [] }))
        );

    const specialists$ = this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/specialists`).pipe(
      catchError(() => of({ success: true, data: [] as SpecialistDto[], message: '', errors: [] }))
    );

    const users$ = this.http.get<ApiResponse<UserDto[]>>(`${environment.apiUrl}/users`).pipe(
      catchError(() => of({ success: true, data: [] as UserDto[], message: '', errors: [] }))
    );

    forkJoin({
      users: users$,
      companies: companies$,
      specialists: specialists$
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.users.set(res.users.data || []);
        this.companies.set(res.companies.data || []);
        this.specialists.set(res.specialists.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  getRoleVariant(role: UserRole): 'primary' | 'success' | 'info' | 'warning' {
    switch (role) {
      case 'SuperAdmin': return 'primary';
      case 'Admin': return 'primary';
      case 'Specialist': return 'info';
      case 'Laboratorist': return 'warning';
      case 'Receptionist': return 'success';
      default: return 'primary';
    }
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'SuperAdmin': return '👑 SuperAdmin';
      case 'Admin': return '🛡️ Admin';
      case 'Specialist': return 'Especialista';
      case 'Laboratorist': return 'Laboratorista';
      case 'Receptionist': return 'Recepcionista';
      default: return role;
    }
  }

  isCompanySelected(companyId: string): boolean {
    return this.selectedCompanyIds().includes(companyId);
  }

  toggleCompanySelection(companyId: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedCompanyIds.update(ids => [...ids, companyId]);
    } else {
      this.selectedCompanyIds.update(ids => ids.filter(id => id !== companyId));
    }
  }

  openCreateModal(): void {
    this.editingUser.set(null);
    this.selectedCompanyIds.set(this.companies().map(c => c.id));
    this.form.reset({
      role: 'Receptionist',
      specialistId: '',
      isActive: true
    });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  openEditModal(user: UserDto): void {
    this.editingUser.set(user);
    this.selectedCompanyIds.set(user.companyIds || []);
    this.form.patchValue({
      username: user.username,
      password: '',
      role: user.role,
      specialistId: user.specialistId || '',
      isActive: user.isActive
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingUser.set(null);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  saveUser(): void {
    const isSuperAdmin = this.form.get('role')?.value === 'SuperAdmin';
    if (this.form.invalid || (!isSuperAdmin && this.selectedCompanyIds().length === 0)) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;
    const editing = this.editingUser();

    const payload = {
      username: val.username,
      password: val.password || null,
      role: val.role,
      specialistId: val.specialistId || null,
      isActive: val.isActive,
      companyIds: isSuperAdmin ? [] : this.selectedCompanyIds()
    };

    if (editing) {
      this.http.put<ApiResponse<UserDto>>(`${environment.apiUrl}/users/${editing.id}`, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Usuario actualizado exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.http.post<ApiResponse<UserDto>>(`${environment.apiUrl}/users`, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Usuario creado exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    }
  }
}
