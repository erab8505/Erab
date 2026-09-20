import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, Gender, PatientDto } from '../../core/models/models';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Directorio de Pacientes</h1>
          <p class="text-slate-500 text-sm">Registro de pacientes, datos demográficos y acceso a expedientes clínicos</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Paciente
        </button>
      </div>

      <app-data-table 
        [data]="patients()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por documento, nombre, teléfono...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('documentId') {
              <span class="font-semibold text-slate-900 dark:text-slate-100">{{ item.documentId }}</span>
            }
            @case ('fullName') {
              <a [routerLink]="['/patients', item.id]" class="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                {{ item.fullName }}
              </a>
            }
            @case ('age') {
              <span>{{ item.age }} años ({{ item.gender }})</span>
            }
            @case ('bloodType') {
              @if (item.bloodType) {
                <span class="text-xs bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 font-bold px-2 py-0.5 rounded">
                  🩸 {{ item.bloodType }}
                </span>
              } @else {
                <span class="text-slate-400">-</span>
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
          <div class="flex items-center justify-end gap-1.5">
            <a [routerLink]="['/scheduling/new']" [queryParams]="{ patientId: item.id }" class="btn btn-secondary btn-sm" title="Agendar nueva cita">
              🗓️ Agendar
            </a>
            <a [routerLink]="['/patients', item.id]" class="btn btn-secondary btn-sm" title="Ver historial clínico completo">
              Expediente
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
        [title]="editingPatient() ? 'Editar Paciente' : 'Nuevo Paciente'"
        size="lg"
        (closed)="closeModal()">
        
        <form [formGroup]="form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="form-group">
              <label class="form-label">No. Documento / Cédula *</label>
              <input type="text" formControlName="documentId" class="form-control" placeholder="Ej. 1020304050" />
              @if (isFieldInvalid('documentId')) {
                <div class="field-error">El documento es obligatorio</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Nombres *</label>
              <input type="text" formControlName="firstName" class="form-control" placeholder="Ej. María Camila" />
              @if (isFieldInvalid('firstName')) {
                <div class="field-error">Los nombres son obligatorios</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Apellidos *</label>
              <input type="text" formControlName="lastName" class="form-control" placeholder="Ej. Gómez Restrepo" />
              @if (isFieldInvalid('lastName')) {
                <div class="field-error">Los apellidos son obligatorios</div>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="form-group">
              <label class="form-label">Fecha de Nacimiento *</label>
              <input type="date" formControlName="dateOfBirth" class="form-control" />
              @if (isFieldInvalid('dateOfBirth')) {
                <div class="field-error">La fecha de nacimiento es obligatoria</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Género *</label>
              <select formControlName="gender" class="form-select">
                <option value="M">Masculino (M)</option>
                <option value="F">Femenino (F)</option>
                <option value="O">Otro (O)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Grupo Sanguíneo</label>
              <select formControlName="bloodType" class="form-select">
                <option value="">Desconocido</option>
                <option value="O+">O Positivo (O+)</option>
                <option value="O-">O Negativo (O-)</option>
                <option value="A+">A Positivo (A+)</option>
                <option value="A-">A Negativo (A-)</option>
                <option value="B+">B Positivo (B+)</option>
                <option value="B-">B Negativo (B-)</option>
                <option value="AB+">AB Positivo (AB+)</option>
                <option value="AB-">AB Negativo (AB-)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Teléfono de Contacto</label>
              <input type="text" formControlName="phone" class="form-control" placeholder="Ej. +57 301 987 6543" />
            </div>

            <div class="form-group">
              <label class="form-label">Correo Electrónico</label>
              <input type="email" formControlName="email" class="form-control" placeholder="paciente@correo.com" />
              @if (isFieldInvalid('email')) {
                <div class="field-error">Ingrese un correo válido</div>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Alergias o Condiciones Especiales</label>
            <textarea formControlName="allergies" class="form-control" rows="2" placeholder="Ej. Alergia a la Penicilina, AINEs..."></textarea>
          </div>

          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="patActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
            <label for="patActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Paciente Activo</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="savePatient()">
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
export class PatientListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly patients = signal<PatientDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingPatient = signal<PatientDto | null>(null);

  readonly columns: TableColumn<PatientDto>[] = [
    { key: 'documentId', label: 'Documento', sortable: true, width: '130px' },
    { key: 'fullName', label: 'Nombre Completo', sortable: true },
    { key: 'age', label: 'Edad / Género', sortable: true, width: '130px' },
    { key: 'bloodType', label: 'RH', width: '90px' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Correo' },
    { key: 'isActive', label: 'Estado', sortable: true, width: '90px' }
  ];

  readonly form: FormGroup = this.fb.group({
    documentId: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    dateOfBirth: ['', [Validators.required]],
    gender: ['M' as Gender, [Validators.required]],
    bloodType: [''],
    phone: [''],
    email: ['', [Validators.email]],
    allergies: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading.set(true);
    this.http.get<ApiResponse<PatientDto[]>>(`${environment.apiUrl}/patients`).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.patients.set(res.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.editingPatient.set(null);
    this.form.reset({
      gender: 'M',
      bloodType: '',
      isActive: true
    });
    this.modalOpen.set(true);
  }

  openEditModal(p: PatientDto): void {
    this.editingPatient.set(p);
    const dobStr = p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '';
    this.form.patchValue({
      documentId: p.documentId,
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: dobStr,
      gender: p.gender,
      bloodType: p.bloodType || '',
      phone: p.phone || '',
      email: p.email || '',
      allergies: p.allergies || '',
      isActive: p.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingPatient.set(null);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  savePatient(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;
    const editing = this.editingPatient();

    const payload = {
      documentId: val.documentId,
      firstName: val.firstName,
      lastName: val.lastName,
      dateOfBirth: new Date(val.dateOfBirth).toISOString(),
      gender: val.gender,
      bloodType: val.bloodType || null,
      phone: val.phone || null,
      email: val.email || null,
      allergies: val.allergies || null,
      isActive: val.isActive
    };

    if (editing) {
      this.http.put<ApiResponse<PatientDto>>(`${environment.apiUrl}/patients/${editing.id}`, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Paciente actualizado exitosamente.');
          this.closeModal();
          this.loadPatients();
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.http.post<ApiResponse<PatientDto>>(`${environment.apiUrl}/patients`, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Paciente registrado exitosamente.');
          this.closeModal();
          this.loadPatients();
        },
        error: () => this.saving.set(false)
      });
    }
  }
}
