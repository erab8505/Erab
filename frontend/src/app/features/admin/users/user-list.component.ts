import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, CompanyDto, EmployeeDto, UserDto, UserRole } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { EmployeeService } from '../../../core/services/employee.service';
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
          <p class="text-slate-500 text-sm">Control de acceso multi-empresa, roles acumulativos y empleados vinculados</p>
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
        placeholder="Buscar por usuario o perfil vinculado...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('roles') {
              <div class="flex flex-wrap gap-1">
                @for (role of (item.roles && item.roles.length > 0 ? item.roles : [item.role]); track role) {
                  <app-badge [variant]="getRoleVariant(role)" [text]="getRoleLabel(role)"></app-badge>
                }
              </div>
            }
            @case ('employeeName') {
              <span class="text-slate-700 dark:text-slate-300">
                @if (item.employeeName || item.specialistName || item.receptionistName) {
                  <span>👤 {{ item.employeeName || item.specialistName || item.receptionistName }}</span>
                } @else {
                  <span class="text-slate-400 italic">Ninguno</span>
                }
              </span>
            }
            @case ('companies') {
              @if (isUserSuperAdmin(item)) {
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
            @case ('isActive') {
              <app-badge [variant]="item.isActive ? 'success' : 'neutral'" [text]="item.isActive ? 'Activo' : 'Inactivo'"></app-badge>
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
              <input type="text" formControlName="username" class="form-control" placeholder="Ej. recepcion_central" />
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

          <!-- Multi-Role Selection Checkboxes -->
          <div class="form-group">
            <label class="form-label">Roles del Sistema * (Seleccione al menos uno)</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              @if (authService.isSuperAdmin()) {
                <label class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [checked]="hasSelectedRole('SuperAdmin')" 
                    (change)="toggleRoleSelection('SuperAdmin', $event)" 
                    class="w-4 h-4 text-blue-600 rounded" />
                  <span>👑 SuperAdmin</span>
                </label>
              }
              <label class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  [checked]="hasSelectedRole('Admin')" 
                  (change)="toggleRoleSelection('Admin', $event)" 
                  class="w-4 h-4 text-blue-600 rounded" />
                <span>🛡️ Admin Empresa</span>
              </label>
              <label class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  [checked]="hasSelectedRole('Specialist')" 
                  (change)="toggleRoleSelection('Specialist', $event)" 
                  class="w-4 h-4 text-blue-600 rounded" />
                <span>🩺 Especialista Médico</span>
              </label>
              <label class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  [checked]="hasSelectedRole('Receptionist')" 
                  (change)="toggleRoleSelection('Receptionist', $event)" 
                  class="w-4 h-4 text-blue-600 rounded" />
                <span>📋 Recepcionista</span>
              </label>
              <label class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  [checked]="hasSelectedRole('Laboratorist')" 
                  (change)="toggleRoleSelection('Laboratorist', $event)" 
                  class="w-4 h-4 text-blue-600 rounded" />
                <span>🔬 Laboratorista</span>
              </label>
            </div>
            @if (selectedRoles().length === 0) {
              <div class="field-error">Debe seleccionar al menos un rol.</div>
            }
          </div>

          <!-- Single Employee Linker -->
          <div class="form-group">
            <label class="form-label">Empleado / Perfil Vinculado (Opcional)</label>
            <select formControlName="employeeId" class="form-select">
              <option [ngValue]="null">-- Sin vincular a empleado específico --</option>
              @for (emp of employees(); track emp.id) {
                <option [value]="emp.id">
                  {{ emp.fullName }} {{ emp.jobTitle ? '(' + emp.jobTitle + ')' : '' }} {{ emp.specialtyName ? '- ' + emp.specialtyName : '' }}
                </option>
              }
            </select>
            <p class="text-xs text-slate-400 mt-1">Vincula el usuario con un empleado para mostrar su nombre profesional y habilitar su agenda/órdenes según sus roles.</p>
          </div>

          <!-- Multi-Company Assignment Checkboxes -->
          @if (hasSelectedRole('SuperAdmin')) {
            <div class="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <span class="text-xl">👑</span>
              <div>
                <div class="font-semibold">Acceso Global Automático</div>
                <div class="text-xs">El rol Super Administrador tiene permiso para gestionar todas las empresas de la plataforma sin restricciones.</div>
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
            [disabled]="form.invalid || selectedRoles().length === 0 || (!hasSelectedRole('SuperAdmin') && selectedCompanyIds().length === 0) || saving()" 
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
  private readonly employeeService = inject(EmployeeService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly users = signal<UserDto[]>([]);
  readonly companies = signal<CompanyDto[]>([]);
  readonly employees = signal<EmployeeDto[]>([]);
  readonly selectedCompanyIds = signal<string[]>([]);
  readonly selectedRoles = signal<UserRole[]>(['Receptionist']);

  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingUser = signal<UserDto | null>(null);

  readonly columns: TableColumn<UserDto>[] = [
    { key: 'username', label: 'Usuario', sortable: true },
    { key: 'roles', label: 'Roles Asignados', sortable: false },
    { key: 'employeeName', label: 'Empleado / Perfil Vinculado' },
    { key: 'companies', label: 'Empresas Asignadas' },
    { key: 'isActive', label: 'Estado', sortable: true, width: '110px' }
  ];

  readonly form: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: [''],
    employeeId: [null],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadData();
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

    const employees$ = this.employeeService.getEmployees().pipe(
      catchError(() => of({ success: true, data: [] as EmployeeDto[], message: '', errors: [] }))
    );

    const users$ = this.http.get<ApiResponse<UserDto[]>>(`${environment.apiUrl}/users`).pipe(
      catchError(() => of({ success: true, data: [] as UserDto[], message: '', errors: [] }))
    );

    forkJoin({
      users: users$,
      companies: companies$,
      employees: employees$
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.users.set(res.users.data || []);
        this.companies.set(res.companies.data || []);
        this.employees.set(res.employees.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  isUserSuperAdmin(item: UserDto): boolean {
    if (item.roles && item.roles.includes('SuperAdmin')) return true;
    return item.role === 'SuperAdmin';
  }

  getRoleVariant(role?: UserRole): 'primary' | 'success' | 'info' | 'warning' {
    switch (role) {
      case 'SuperAdmin': return 'primary';
      case 'Admin': return 'primary';
      case 'Specialist': return 'info';
      case 'Laboratorist': return 'warning';
      case 'Receptionist': return 'success';
      default: return 'primary';
    }
  }

  getRoleLabel(role?: UserRole): string {
    switch (role) {
      case 'SuperAdmin': return '👑 SuperAdmin';
      case 'Admin': return '🛡️ Admin';
      case 'Specialist': return '🩺 Especialista';
      case 'Laboratorist': return '🔬 Laboratorista';
      case 'Receptionist': return '📋 Recepcionista';
      default: return role || '';
    }
  }

  hasSelectedRole(role: UserRole): boolean {
    return this.selectedRoles().includes(role);
  }

  toggleRoleSelection(role: UserRole, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedRoles.update(roles => [...roles, role]);
    } else {
      this.selectedRoles.update(roles => roles.filter(r => r !== role));
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
    this.selectedRoles.set(['Receptionist']);
    this.form.reset({
      username: '',
      password: '',
      employeeId: null,
      isActive: true
    });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  openEditModal(user: UserDto): void {
    this.editingUser.set(user);
    this.selectedCompanyIds.set(user.companyIds || []);
    const roles: UserRole[] = user.roles && user.roles.length > 0 ? user.roles : (user.role ? [user.role] : ['Receptionist']);
    this.selectedRoles.set(roles);
    this.form.patchValue({
      username: user.username,
      password: '',
      employeeId: user.employeeId || user.specialistId || user.receptionistId || null,
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
    const isSuperAdmin = this.hasSelectedRole('SuperAdmin');
    if (this.form.invalid || this.selectedRoles().length === 0 || (!isSuperAdmin && this.selectedCompanyIds().length === 0)) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;
    const editing = this.editingUser();

    const payload = {
      username: val.username.trim(),
      password: val.password ? val.password.trim() : null,
      roles: this.selectedRoles(),
      role: this.selectedRoles()[0],
      employeeId: val.employeeId || null,
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
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.message || 'Error al actualizar el usuario.');
        }
      });
    } else {
      this.http.post<ApiResponse<UserDto>>(`${environment.apiUrl}/users`, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Usuario creado exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.message || 'Error al crear el usuario.');
        }
      });
    }
  }
}
