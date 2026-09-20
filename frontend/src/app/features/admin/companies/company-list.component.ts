import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, CompanyDto } from '../../../core/models/models';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Gestión de Empresas</h1>
          <p class="text-slate-500 text-sm">Administración central de entidades clínicas y sedes</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Empresa
        </button>
      </div>

      <app-data-table 
        [data]="companies()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por nombre, NIT, email...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('name') {
              <div class="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {{ item.name }}
                @if (companyContext.activeCompanyId() === item.id) {
                  <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Activa</span>
                }
              </div>
            }
            @case ('isActive') {
              <app-badge [variant]="item.isActive ? 'success' : 'neutral'" [text]="item.isActive ? 'Activo' : 'Inactivo'"></app-badge>
            }
            @case ('createdAt') {
              <span class="text-slate-500">{{ item.createdAt | date:'dd/MM/yyyy' }}</span>
            }
            @default {
              {{ item[col.key] || '-' }}
            }
          }
        </ng-template>

        <ng-template #actionTemplate let-item>
          <div class="flex items-center justify-end gap-1.5">
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              title="Establecer como empresa activa de trabajo"
              (click)="selectActive(item)">
              Seleccionar
            </button>
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              title="Editar empresa"
              (click)="openEditModal(item)">
              Editar
            </button>
          </div>
        </ng-template>
      </app-data-table>

      <!-- Modal Crear / Editar -->
      <app-modal 
        [isOpen]="modalOpen()" 
        [title]="editingCompany() ? 'Editar Empresa' : 'Nueva Empresa'"
        size="md"
        (closed)="closeModal()">
        
        <form [formGroup]="form" class="space-y-4">
          <div class="form-group">
            <label class="form-label">Nombre de la Empresa *</label>
            <input type="text" formControlName="name" class="form-control" placeholder="Ej. Clínica San Lucas" />
            @if (isFieldInvalid('name')) {
              <div class="field-error">El nombre es obligatorio</div>
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">NIT / RUC / Identificación Fiscal</label>
              <input type="text" formControlName="taxId" class="form-control" placeholder="Ej. 900.123.456-7" />
            </div>

            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="text" formControlName="phone" class="form-control" placeholder="Ej. +57 300 123 4567" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input type="email" formControlName="email" class="form-control" placeholder="contacto@clinica.com" />
            @if (isFieldInvalid('email')) {
              <div class="field-error">Ingrese un correo electrónico válido</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Dirección</label>
            <input type="text" formControlName="address" class="form-control" placeholder="Ej. Carrera 43A # 1-50, Consultorio 301" />
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea formControlName="description" class="form-control" rows="2" placeholder="Detalles de la sede o especialidad general..."></textarea>
          </div>

          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
            <label for="isActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Empresa Activa</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="saveCompany()">
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
export class CompanyListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  readonly companyContext = inject(CompanyContextService);
  private readonly toast = inject(ToastService);

  readonly companies = signal<CompanyDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingCompany = signal<CompanyDto | null>(null);

  readonly columns: TableColumn<CompanyDto>[] = [
    { key: 'name', label: 'Empresa', sortable: true },
    { key: 'taxId', label: 'NIT / Tax ID', sortable: true },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Correo' },
    { key: 'isActive', label: 'Estado', sortable: true, width: '100px' },
    { key: 'createdAt', label: 'Fecha Registro', sortable: true, width: '130px' }
  ];

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    taxId: [''],
    address: [''],
    phone: [''],
    email: ['', [Validators.email]],
    description: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading.set(true);
    this.http.get<ApiResponse<CompanyDto[]>>(`${environment.apiUrl}/companies`).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.companies.set(res.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.editingCompany.set(null);
    this.form.reset({ isActive: true });
    this.modalOpen.set(true);
  }

  openEditModal(company: CompanyDto): void {
    this.editingCompany.set(company);
    this.form.patchValue({
      name: company.name,
      taxId: company.taxId || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      description: company.description || '',
      isActive: company.isActive
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingCompany.set(null);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  saveCompany(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;
    const editing = this.editingCompany();

    if (editing) {
      this.http.put<ApiResponse<CompanyDto>>(`${environment.apiUrl}/companies/${editing.id}`, val).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success('Empresa actualizada exitosamente.');
          this.closeModal();
          this.loadCompanies();
          // Update active company if it was the one edited
          if (this.companyContext.activeCompanyId() === editing.id) {
            this.companyContext.setActiveCompany(res.data);
          }
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.http.post<ApiResponse<CompanyDto>>(`${environment.apiUrl}/companies`, val).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Empresa creada exitosamente.');
          this.closeModal();
          this.loadCompanies();
        },
        error: () => this.saving.set(false)
      });
    }
  }

  selectActive(company: CompanyDto): void {
    this.companyContext.setActiveCompany(company);
    this.toast.info(`Empresa activa establecida a: ${company.name}`);
  }
}
