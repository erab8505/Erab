import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, AreaDto } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-area-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Áreas Médicas</h1>
          <p class="text-slate-500 text-sm">Departamentos y divisiones clínicas de la empresa activa</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Área
        </button>
      </div>

      <app-data-table 
        [data]="areas()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por nombre o descripción...">
        
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
        [title]="editingArea() ? 'Editar Área Médica' : 'Nueva Área Médica'"
        size="md"
        (closed)="closeModal()">
        
        <form [formGroup]="form" class="space-y-4">
          <div class="form-group">
            <label class="form-label">Nombre del Área *</label>
            <input type="text" formControlName="name" class="form-control" placeholder="Ej. Medicina Interna, Cirugía, Pediatría" />
            @if (isFieldInvalid('name')) {
              <div class="field-error">El nombre es obligatorio</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea formControlName="description" class="form-control" rows="3" placeholder="Detalles de cobertura del área..."></textarea>
          </div>

          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="areaActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
            <label for="areaActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Área Activa</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="saveArea()">
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
export class AreaListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly areas = signal<AreaDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingArea = signal<AreaDto | null>(null);

  readonly columns: TableColumn<AreaDto>[] = [
    { key: 'name', label: 'Nombre del Área', sortable: true },
    { key: 'description', label: 'Descripción' },
    { key: 'isActive', label: 'Estado', sortable: true, width: '120px' }
  ];

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadAreas();
  }

  loadAreas(): void {
    this.loading.set(true);
    this.http.get<ApiResponse<AreaDto[]>>(`${environment.apiUrl}/areas`).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.areas.set(res.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.editingArea.set(null);
    this.form.reset({ isActive: true });
    this.modalOpen.set(true);
  }

  openEditModal(area: AreaDto): void {
    this.editingArea.set(area);
    this.form.patchValue({
      name: area.name,
      description: area.description || '',
      isActive: area.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingArea.set(null);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  saveArea(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;
    const editing = this.editingArea();

    if (editing) {
      this.http.put<ApiResponse<AreaDto>>(`${environment.apiUrl}/areas/${editing.id}`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Área médica actualizada.');
          this.closeModal();
          this.loadAreas();
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.http.post<ApiResponse<AreaDto>>(`${environment.apiUrl}/areas`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Área médica creada.');
          this.closeModal();
          this.loadAreas();
        },
        error: () => this.saving.set(false)
      });
    }
  }
}
