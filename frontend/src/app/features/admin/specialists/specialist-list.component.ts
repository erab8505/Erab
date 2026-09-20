import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, SpecialistDto, SpecialtyDto } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-specialist-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Directorio de Especialistas Médicos</h1>
          <p class="text-slate-500 text-sm">Registro de médicos, números de colegiatura y asignación de especialidad</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()" [disabled]="specialties().length === 0">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Especialista
        </button>
      </div>

      <app-data-table 
        [data]="specialists()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por nombre, licencia, especialidad...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('fullName') {
              <div class="font-medium text-slate-900 dark:text-slate-100">
                👨‍⚕️ {{ item.fullName }}
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
            <a [routerLink]="['/specialists', item.id, 'availability']" class="btn btn-secondary btn-sm" title="Configurar disponibilidad semanal">
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
        [title]="editingSpecialist() ? 'Editar Especialista' : 'Nuevo Especialista'"
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
              <label class="form-label">Especialidad Médica *</label>
              <select formControlName="specialtyId" class="form-select">
                <option value="" disabled>Seleccione especialidad...</option>
                @for (spec of specialties(); track spec.id) {
                  <option [value]="spec.id">{{ spec.name }} ({{ spec.areaName }})</option>
                }
              </select>
              @if (isFieldInvalid('specialtyId')) {
                <div class="field-error">Debe seleccionar una especialidad</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Número de Licencia / Colegiatura *</label>
              <input type="text" formControlName="licenseNumber" class="form-control" placeholder="Ej. MP-987654" />
              @if (isFieldInvalid('licenseNumber')) {
                <div class="field-error">La colegiatura es obligatoria</div>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Teléfono de Contacto</label>
              <input type="text" formControlName="phone" class="form-control" placeholder="Ej. +57 312 456 7890" />
            </div>

            <div class="form-group">
              <label class="form-label">Correo Electrónico</label>
              <input type="email" formControlName="email" class="form-control" placeholder="dr.mendoza@clinica.com" />
              @if (isFieldInvalid('email')) {
                <div class="field-error">Ingrese un correo válido</div>
              }
            </div>
          </div>

          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="docActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
            <label for="docActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Especialista Activo</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="saveSpecialist()">
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
export class SpecialistListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly specialists = signal<SpecialistDto[]>([]);
  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingSpecialist = signal<SpecialistDto | null>(null);

  readonly columns: TableColumn<SpecialistDto>[] = [
    { key: 'fullName', label: 'Especialista', sortable: true },
    { key: 'licenseNumber', label: 'No. Colegiatura / Licencia', sortable: true },
    { key: 'specialtyName', label: 'Especialidad', sortable: true },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Correo' },
    { key: 'isActive', label: 'Estado', sortable: true, width: '100px' }
  ];

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    specialtyId: ['', [Validators.required]],
    licenseNumber: ['', [Validators.required]],
    phone: [''],
    email: ['', [Validators.email]],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      specialists: this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/specialists`),
      specialties: this.http.get<ApiResponse<SpecialtyDto[]>>(`${environment.apiUrl}/specialties`)
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.specialists.set(res.specialists.data || []);
        this.specialties.set(res.specialties.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.editingSpecialist.set(null);
    this.form.reset({ specialtyId: '', isActive: true });
    this.modalOpen.set(true);
  }

  openEditModal(doc: SpecialistDto): void {
    this.editingSpecialist.set(doc);
    this.form.patchValue({
      firstName: doc.firstName,
      lastName: doc.lastName,
      specialtyId: doc.specialtyId,
      licenseNumber: doc.licenseNumber,
      phone: doc.phone || '',
      email: doc.email || '',
      isActive: doc.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingSpecialist.set(null);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  saveSpecialist(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;
    const editing = this.editingSpecialist();

    if (editing) {
      this.http.put<ApiResponse<SpecialistDto>>(`${environment.apiUrl}/specialists/${editing.id}`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Especialista actualizado exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.http.post<ApiResponse<SpecialistDto>>(`${environment.apiUrl}/specialists`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Especialista registrado exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    }
  }
}
