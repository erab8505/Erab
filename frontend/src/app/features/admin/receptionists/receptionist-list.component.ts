import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ReceptionistDto } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-receptionist-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Catálogo de Personal de Recepción</h1>
          <p class="text-slate-500 text-sm">Registro y control de recepcionistas y personal de atención</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Recepcionista
        </button>
      </div>

      <app-data-table 
        [data]="receptionists()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por nombre, documento, correo, teléfono...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('fullName') {
              <div class="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>📋</span>
                <span>{{ item.fullName }}</span>
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
            <button type="button" class="btn btn-secondary btn-sm" (click)="openEditModal(item)">
              Editar
            </button>
          </div>
        </ng-template>
      </app-data-table>

      <!-- Modal Crear / Editar -->
      <app-modal 
        [isOpen]="modalOpen()" 
        [title]="editingReceptionist() ? 'Editar Recepcionista' : 'Nuevo Recepcionista'"
        size="lg"
        (closed)="closeModal()">
        
        <form [formGroup]="form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Nombres *</label>
              <input type="text" formControlName="firstName" class="form-control" placeholder="Ej. Ana Lucía" />
              @if (isFieldInvalid('firstName')) {
                <div class="field-error">Los nombres son obligatorios</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Apellidos *</label>
              <input type="text" formControlName="lastName" class="form-control" placeholder="Ej. Martínez Rivas" />
              @if (isFieldInvalid('lastName')) {
                <div class="field-error">Los apellidos son obligatorios</div>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Número de Cédula / DNI / Identificación</label>
              <input type="text" formControlName="identificationNumber" class="form-control" placeholder="Ej. 1020304050" />
            </div>

            <div class="form-group">
              <label class="form-label">Teléfono de Contacto</label>
              <input type="text" formControlName="phone" class="form-control" placeholder="Ej. +57 300 123 4567" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input type="email" formControlName="email" class="form-control" placeholder="recepcion.ana@clinica.com" />
            @if (isFieldInvalid('email')) {
              <div class="field-error">Ingrese un correo válido</div>
            }
          </div>

          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="recActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
            <label for="recActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Recepcionista Activo/a</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="saveReceptionist()">
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
export class ReceptionistListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly receptionists = signal<ReceptionistDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingReceptionist = signal<ReceptionistDto | null>(null);

  readonly columns: TableColumn<ReceptionistDto>[] = [
    { key: 'fullName', label: 'Recepcionista', sortable: true },
    { key: 'identificationNumber', label: 'Cédula / DNI', sortable: true },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Correo' },
    { key: 'isActive', label: 'Estado', sortable: true, width: '110px' }
  ];

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    identificationNumber: [''],
    phone: [''],
    email: ['', [Validators.email]],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.http.get<ApiResponse<ReceptionistDto[]>>(`${environment.apiUrl}/receptionists`).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.receptionists.set(res.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.editingReceptionist.set(null);
    this.form.reset({ isActive: true });
    this.modalOpen.set(true);
  }

  openEditModal(rec: ReceptionistDto): void {
    this.editingReceptionist.set(rec);
    this.form.patchValue({
      firstName: rec.firstName,
      lastName: rec.lastName,
      identificationNumber: rec.identificationNumber || '',
      phone: rec.phone || '',
      email: rec.email || '',
      isActive: rec.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingReceptionist.set(null);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  saveReceptionist(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;
    const editing = this.editingReceptionist();

    if (editing) {
      this.http.put<ApiResponse<ReceptionistDto>>(`${environment.apiUrl}/receptionists/${editing.id}`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Recepcionista actualizado exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.http.post<ApiResponse<ReceptionistDto>>(`${environment.apiUrl}/receptionists`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Recepcionista registrado exitosamente.');
          this.closeModal();
          this.loadData();
        },
        error: () => this.saving.set(false)
      });
    }
  }
}
