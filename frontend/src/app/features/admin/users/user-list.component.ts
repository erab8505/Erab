import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, CompanyDto, SpecialistDto, UserDto, UserRole } from '../../../core/models/models';
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
        <button type="button" class="btn btn-primary" (click)="openCreateModal()" [disabled]="companies().length === 0">
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
              <app-badge [variant]="getRoleVariant(item.role)" [text]="item.role"></app-badge>
            }
            @case ('specialistName') {
              <span class="text-slate-700 dark:text-slate-300">
                {{ item.specialistName ? '👨‍⚕️ ' + item.specialistName : 'Ninguno' }}
              </span>
            }
            @case ('companies') {
              <div class="flex flex-wrap gap-1">
                @for (c of item.companies; track c.id) {
                  <span class="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                    {{ c.name }}
                  </span>
                }
              </div>
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
              <select formControlName="role" class="form-select">
                <option value="Admin">Administrador (Admin)</option>
                <option value="Receptionist">Recepcionista</option>
                <option value="Specialist">Especialista Médico</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Perfil Especialista Asociado (Opcional)</label>
              <select formControlName="specialistId" class="form-select">
                <option value="">Sin vincular a especialista</option>
                @for (doc of specialists(); track doc.id) {
                  <option [value]="doc.id">{{ doc.fullName }} ({{ doc.specialtyName }})</option>
                }
              </select>
            </div>
          </div>

          <!-- Multi-Company Assignment Checkboxes -->
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
            [disabled]="form.invalid || selectedCompanyIds().length === 0 || saving()" 
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

  readonly users = signal<UserDto[]>([]);
  readonly companies = signal<CompanyDto[]>([]);
  readonly specialists = signal<SpecialistDto[]>([]);
  readonly selectedCompanyIds = signal<string[]>([]);

  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingUser = signal<UserDto | null>(null);

  readonly columns: TableColumn<UserDto>[] = [
    { key: 'username', label: 'Usuario', sortable: true },
    { key: 'role', label: 'Rol', sortable: true, width: '130px' },
    { key: 'specialistName', label: 'Especialista Vinculado' },
    { key: 'companies', label: 'Empresas Asignadas' },
    { key: 'isActive', label: 'Estado', sortable: true, width: '100px' }
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

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      users: this.http.get<ApiResponse<UserDto[]>>(`${environment.apiUrl}/users`),
      companies: this.http.get<ApiResponse<CompanyDto[]>>(`${environment.apiUrl}/companies`),
      specialists: this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/specialists`)
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

  getRoleVariant(role: UserRole): 'primary' | 'success' | 'info' {
    switch (role) {
      case 'Admin': return 'primary';
      case 'Specialist': return 'info';
      case 'Receptionist': return 'success';
      default: return 'primary';
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
    if (this.form.invalid || this.selectedCompanyIds().length === 0) {
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
      companyIds: this.selectedCompanyIds()
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
