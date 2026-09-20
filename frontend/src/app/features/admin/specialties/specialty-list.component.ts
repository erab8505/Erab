import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, AreaDto, SpecialtyDto } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-specialty-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Especialidades Médicas</h1>
          <p class="text-slate-500 text-sm">Especialidades clínicas vinculadas a cada área médica</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()" [disabled]="areas().length === 0">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Especialidad
        </button>
      </div>

      @if (areas().length === 0 && !loading()) {
        <div class="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          Debe crear al menos un <b>Área Médica</b> antes de poder agregar especialidades.
        </div>
      }

      <app-data-table 
        [data]="specialties()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por especialidad o área...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
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
        [title]="editingSpecialty() ? 'Editar Especialidad' : 'Nueva Especialidad'"
        size="md"
        (closed)="closeModal()">
        
        <form [formGroup]="form" class="space-y-4">
          <div class="form-group">
            <label class="form-label">Área Médica Perteneciente *</label>
            <select formControlName="areaId" class="form-select">
              <option value="" disabled>Seleccione un área...</option>
              @for (area of areas(); track area.id) {
                <option [value]="area.id">{{ area.name }}</option>
              }
            </select>
            @if (isFieldInvalid('areaId')) {
              <div class="field-error">El área médica es requerida</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Nombre de la Especialidad *</label>
            <input type="text" formControlName="name" class="form-control" placeholder="Ej. Cardiología, Dermatología, Neurología" />
            @if (isFieldInvalid('name')) {
              <div class="field-error">El nombre es obligatorio</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea formControlName="description" class="form-control" rows="3" placeholder="Alcance y detalle clínico de la especialidad..."></textarea>
          </div>

          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="specActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
            <label for="specActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Especialidad Activa</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="saveSpecialty()">
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
export class SpecialtyListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly areas = signal<AreaDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingSpecialty = signal<SpecialtyDto | null>(null);

  readonly columns: TableColumn<SpecialtyDto>[] = [
    { key: 'name', label: 'Especialidad', sortable: true },
    { key: 'areaName', label: 'Área Médica', sortable: true },
    { key: 'description', label: 'Descripción' },
    { key: 'isActive', label: 'Estado', sortable: true, width: '120px' }
  ];

  readonly form: FormGroup = this.fb.group({
    areaId: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      specialties: this.http.get<ApiResponse<SpecialtyDto[]>>(`${environment.apiUrl}/specialties`),
      areas: this.http.get<ApiResponse<AreaDto[]>>(`${environment.apiUrl}/areas`)
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.specialties.set(res.specialties.data || []);
        this.areas.set(res.areas.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.editingSpecialty.set(null);
    this.form.reset({ areaId: '', isActive: true });
    this.modalOpen.set(true);
  }

  openEditModal(spec: SpecialtyDto): void {
    this.editingSpecialty.set(spec);
    this.form.patchValue({
      areaId: spec.areaId,
      name: spec.name,
      description: spec.description || '',
      isActive: spec.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingSpecialty.set(null);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  saveSpecialty(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;
    const editing = this.editingSpecialty();

    if (editing) {
      this.http.put<ApiResponse<SpecialtyDto>>(`${environment.apiUrl}/specialties/${editing.id}`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Especialidad actualizada exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.http.post<ApiResponse<SpecialtyDto>>(`${environment.apiUrl}/specialties`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Especialidad creada exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    }
  }
}
