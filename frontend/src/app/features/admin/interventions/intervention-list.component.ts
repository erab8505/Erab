import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, InterventionTypeDto, SpecialtyDto } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-intervention-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Procedimientos e Intervenciones Médicas</h1>
          <p class="text-slate-500 text-sm">Catálogo de tipos de consulta, cirugías y duraciones estimadas</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()" [disabled]="specialties().length === 0">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Procedimiento
        </button>
      </div>

      <app-data-table 
        [data]="interventions()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por procedimiento, código CPT o especialidad...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('durationMinutes') {
              <span class="font-medium text-slate-700 dark:text-slate-300">⏱️ {{ item.durationMinutes }} min</span>
            }
            @case ('requiresAnesthesia') {
              <span [class]="item.requiresAnesthesia ? 'text-amber-600 font-semibold' : 'text-slate-400'">
                {{ item.requiresAnesthesia ? 'Sí' : 'No' }}
              </span>
            }
            @case ('requiresHospitalization') {
              <span [class]="item.requiresHospitalization ? 'text-rose-600 font-semibold' : 'text-slate-400'">
                {{ item.requiresHospitalization ? 'Sí' : 'No' }}
              </span>
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
        [title]="editingIntervention() ? 'Editar Procedimiento' : 'Nuevo Procedimiento'"
        size="lg"
        (closed)="closeModal()">
        
        <form [formGroup]="form" class="space-y-4">
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
              <label class="form-label">Código CPT / CUPS</label>
              <input type="text" formControlName="code" class="form-control" placeholder="Ej. 890201, CPT-99213" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Nombre del Procedimiento *</label>
              <input type="text" formControlName="name" class="form-control" placeholder="Ej. Consulta de Control, Ecocardiograma" />
              @if (isFieldInvalid('name')) {
                <div class="field-error">El nombre es obligatorio</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Duración Estimada (Minutos) *</label>
              <input type="number" formControlName="durationMinutes" class="form-control" min="5" max="480" step="5" />
              @if (isFieldInvalid('durationMinutes')) {
                <div class="field-error">Ingrese una duración válida (min. 5 minutos)</div>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea formControlName="description" class="form-control" rows="2" placeholder="Indicaciones o requisitos previos..."></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="anesthesia" formControlName="requiresAnesthesia" class="w-4 h-4 text-blue-600 rounded" />
              <label for="anesthesia" class="text-sm font-medium text-slate-700 dark:text-slate-300">Requiere Anestesia</label>
            </div>

            <div class="flex items-center gap-2">
              <input type="checkbox" id="hospitalization" formControlName="requiresHospitalization" class="w-4 h-4 text-blue-600 rounded" />
              <label for="hospitalization" class="text-sm font-medium text-slate-700 dark:text-slate-300">Requiere Hospitalización</label>
            </div>

            <div class="flex items-center gap-2">
              <input type="checkbox" id="intActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
              <label for="intActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Procedimiento Activo</label>
            </div>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="saveIntervention()">
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
export class InterventionListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly interventions = signal<InterventionTypeDto[]>([]);
  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingIntervention = signal<InterventionTypeDto | null>(null);

  readonly columns: TableColumn<InterventionTypeDto>[] = [
    { key: 'name', label: 'Procedimiento', sortable: true },
    { key: 'code', label: 'Código', sortable: true, width: '110px' },
    { key: 'specialtyName', label: 'Especialidad', sortable: true },
    { key: 'durationMinutes', label: 'Duración', sortable: true, width: '120px' },
    { key: 'requiresAnesthesia', label: 'Anestesia', width: '100px', align: 'center' },
    { key: 'requiresHospitalization', label: 'Hosp.', width: '90px', align: 'center' },
    { key: 'isActive', label: 'Estado', sortable: true, width: '100px' }
  ];

  readonly form: FormGroup = this.fb.group({
    specialtyId: ['', [Validators.required]],
    name: ['', [Validators.required]],
    code: [''],
    durationMinutes: [30, [Validators.required, Validators.min(5)]],
    requiresAnesthesia: [false],
    requiresHospitalization: [false],
    description: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      interventions: this.http.get<ApiResponse<InterventionTypeDto[]>>(`${environment.apiUrl}/intervention-types`),
      specialties: this.http.get<ApiResponse<SpecialtyDto[]>>(`${environment.apiUrl}/specialties`)
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.interventions.set(res.interventions.data || []);
        this.specialties.set(res.specialties.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.editingIntervention.set(null);
    this.form.reset({
      specialtyId: '',
      durationMinutes: 30,
      requiresAnesthesia: false,
      requiresHospitalization: false,
      isActive: true
    });
    this.modalOpen.set(true);
  }

  openEditModal(item: InterventionTypeDto): void {
    this.editingIntervention.set(item);
    this.form.patchValue({
      specialtyId: item.specialtyId,
      name: item.name,
      code: item.code || '',
      durationMinutes: item.durationMinutes,
      requiresAnesthesia: item.requiresAnesthesia,
      requiresHospitalization: item.requiresHospitalization,
      description: item.description || '',
      isActive: item.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingIntervention.set(null);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  saveIntervention(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;
    const editing = this.editingIntervention();

    if (editing) {
      this.http.put<ApiResponse<InterventionTypeDto>>(`${environment.apiUrl}/intervention-types/${editing.id}`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Procedimiento actualizado.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.http.post<ApiResponse<InterventionTypeDto>>(`${environment.apiUrl}/intervention-types`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Procedimiento creado exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    }
  }
}
