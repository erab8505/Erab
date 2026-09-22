import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, EmployeeDto, SpecialtyDto } from '../../../core/models/models';
import { EmployeeService } from '../../../core/services/employee.service';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Directorio de Empleados</h1>
          <p class="text-slate-500 text-sm">Gestión unificada de personal médico, recepcionistas, laboratoristas y administrativos</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Empleado
        </button>
      </div>

      <app-data-table 
        [data]="employees()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por nombre, documento, cargo, especialidad...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('fullName') {
              <div class="flex items-center gap-2">
                <span class="text-lg">
                  {{ item.specialtyId ? '👨‍⚕️' : '👤' }}
                </span>
                <div>
                  <div class="font-medium text-slate-900 dark:text-slate-100">
                    {{ item.fullName }}
                  </div>
                  @if (item.identificationNumber) {
                    <div class="text-xs text-slate-400">Doc: {{ item.identificationNumber }}</div>
                  }
                </div>
              </div>
            }
            @case ('jobTitle') {
              <div>
                <span class="font-medium text-slate-800 dark:text-slate-200">{{ item.jobTitle || 'Sin cargo asignado' }}</span>
                @if (item.specialtyName) {
                  <span class="block text-xs text-blue-600 dark:text-blue-400 font-semibold">{{ item.specialtyName }}</span>
                }
              </div>
            }
            @case ('licenseNumber') {
              <span class="text-sm font-mono text-slate-600 dark:text-slate-300">
                {{ item.licenseNumber || '-' }}
              </span>
            }
            @case ('contact') {
              <div class="text-xs space-y-0.5">
                @if (item.email) {
                  <div class="text-slate-600 dark:text-slate-400">✉️ {{ item.email }}</div>
                }
                @if (item.phone) {
                  <div class="text-slate-600 dark:text-slate-400">📞 {{ item.phone }}</div>
                }
                @if (!item.email && !item.phone) {
                  <span class="text-slate-400">-</span>
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
          <div class="flex items-center justify-end gap-1.5">
            <a [routerLink]="['/employees', item.id, 'availability']" class="btn btn-secondary btn-sm" title="Configurar disponibilidad semanal">
              🗓️ Horarios
            </a>
            <button type="button" class="btn btn-secondary btn-sm" (click)="openEditModal(item)">
              Editar
            </button>
          </div>
        </ng-template>
      </app-data-table>

      <!-- Modal Crear / Editar -->
      <app-modal 
        [isOpen]="modalOpen()" 
        [title]="editingEmployee() ? 'Editar Empleado' : 'Nuevo Empleado'"
        size="lg"
        (closed)="closeModal()">
        
        <form [formGroup]="form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Nombres *</label>
              <input type="text" formControlName="firstName" class="form-control" placeholder="Ej. Carlos Eduardo" />
              @if (isFieldInvalid('firstName')) {
                <div class="field-error">Los nombres son obligatorios</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Apellidos *</label>
              <input type="text" formControlName="lastName" class="form-control" placeholder="Ej. Mendoza Gómez" />
              @if (isFieldInvalid('lastName')) {
                <div class="field-error">Los apellidos son obligatorios</div>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Puesto / Cargo</label>
              <input type="text" formControlName="jobTitle" class="form-control" placeholder="Ej. Médico Cardiólogo, Recepcionista..." />
            </div>

            <div class="form-group">
              <label class="form-label">Documento de Identificación (DNI / Cédula)</label>
              <input type="text" formControlName="identificationNumber" class="form-control" placeholder="Ej. 1098765432" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Especialidad Médica (Opcional)</label>
              <select formControlName="specialtyId" class="form-select">
                <option [ngValue]="null">-- Ninguna / No Aplica --</option>
                @for (spec of specialties(); track spec.id) {
                  <option [value]="spec.id">{{ spec.name }} ({{ spec.areaName }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Número de Licencia / Colegiatura</label>
              <input type="text" formControlName="licenseNumber" class="form-control" placeholder="Ej. MED-CARD-9912" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Teléfono de Contacto</label>
              <input type="text" formControlName="phone" class="form-control" placeholder="Ej. +52 55 1234 5678" />
            </div>

            <div class="form-group">
              <label class="form-label">Correo Electrónico</label>
              <input type="email" formControlName="email" class="form-control" placeholder="carlos.mendoza@clinica.com" />
              @if (isFieldInvalid('email')) {
                <div class="field-error">Ingrese un correo válido</div>
              }
            </div>
          </div>

          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="empActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
            <label for="empActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Empleado Activo</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="saveEmployee()">
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
export class EmployeeListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly employees = signal<EmployeeDto[]>([]);
  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingEmployee = signal<EmployeeDto | null>(null);

  readonly columns: TableColumn<EmployeeDto>[] = [
    { key: 'fullName', label: 'Empleado / Nombre', sortable: true },
    { key: 'jobTitle', label: 'Puesto / Especialidad', sortable: true },
    { key: 'licenseNumber', label: 'Colegiatura / Licencia', sortable: true },
    { key: 'contact', label: 'Contacto' },
    { key: 'isActive', label: 'Estado', sortable: true },
    { key: 'actions', label: 'Acciones' }
  ];

  form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    jobTitle: ['', [Validators.maxLength(150)]],
    identificationNumber: ['', [Validators.maxLength(50)]],
    specialtyId: [null],
    licenseNumber: ['', [Validators.maxLength(50)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(50)]],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      employees: this.employeeService.getEmployees(),
      specialties: this.http.get<ApiResponse<SpecialtyDto[]>>(`${environment.apiUrl}/specialties`)
    }).subscribe({
      next: ({ employees, specialties }) => {
        this.employees.set(employees.data || []);
        this.specialties.set(specialties.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la lista de empleados.');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.editingEmployee.set(null);
    this.form.reset({
      firstName: '',
      lastName: '',
      jobTitle: '',
      identificationNumber: '',
      specialtyId: null,
      licenseNumber: '',
      email: '',
      phone: '',
      isActive: true
    });
    this.modalOpen.set(true);
  }

  openEditModal(item: EmployeeDto): void {
    this.editingEmployee.set(item);
    this.form.patchValue({
      firstName: item.firstName,
      lastName: item.lastName,
      jobTitle: item.jobTitle || '',
      identificationNumber: item.identificationNumber || '',
      specialtyId: item.specialtyId || null,
      licenseNumber: item.licenseNumber || '',
      email: item.email || '',
      phone: item.phone || '',
      isActive: item.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingEmployee.set(null);
  }

  saveEmployee(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formVal = this.form.value;
    const payload = {
      firstName: formVal.firstName.trim(),
      lastName: formVal.lastName.trim(),
      jobTitle: formVal.jobTitle?.trim() || null,
      identificationNumber: formVal.identificationNumber?.trim() || null,
      specialtyId: formVal.specialtyId || null,
      licenseNumber: formVal.licenseNumber?.trim() || null,
      email: formVal.email?.trim() || null,
      phone: formVal.phone?.trim() || null,
      isActive: formVal.isActive ?? true
    };

    const editing = this.editingEmployee();
    const req$ = editing
      ? this.employeeService.updateEmployee(editing.id, payload)
      : this.employeeService.createEmployee(payload);

    req$.subscribe({
      next: () => {
        this.toast.success(editing ? 'Empleado actualizado exitosamente.' : 'Empleado creado exitosamente.');
        this.saving.set(false);
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al guardar el empleado.');
        this.saving.set(false);
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
