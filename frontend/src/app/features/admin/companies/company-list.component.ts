import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, CompanyDto, CompanyFeatureKeys } from '../../../core/models/models';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
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
          <p class="text-slate-500 text-sm">Administración central de entidades clínicas, sedes y características activas</p>
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
            @case ('modules') {
              <div class="flex items-center gap-1.5 flex-wrap">
                @if (item.features?.[CompanyFeatureKeys.ModuleScheduling] ?? true) {
                  <span class="text-[11px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" title="Módulo de Citas y Agenda activo">
                    📅 Citas
                  </span>
                }
                @if (item.features?.[CompanyFeatureKeys.ModuleLaboratory]) {
                  <span class="text-[11px] px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800" title="Módulo de Laboratorio activo">
                    🔬 Lab
                  </span>
                  @if (item.features?.[CompanyFeatureKeys.AllowReceptionistStudyOrders]) {
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800" title="Recepcionistas pueden emitir estudios">
                      +Recep
                    </span>
                  }
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
              title="Editar empresa y características"
              (click)="openEditModal(item)">
              Editar
            </button>
          </div>
        </ng-template>
      </app-data-table>

      <!-- Modal Crear / Editar -->
      <app-modal 
        [isOpen]="modalOpen()" 
        [title]="editingCompany() ? 'Editar Empresa y Características' : 'Nueva Empresa'"
        size="lg"
        (closed)="closeModal()">
        
        <form [formGroup]="form" class="space-y-4">
          <!-- Datos Básicos -->
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

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea formControlName="description" class="form-control" rows="2" placeholder="Detalles de la sede o especialidad general..."></textarea>
          </div>

          <!-- SECCIÓN: Feature Flags & Módulos -->
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>⚙️</span> Características y Módulos de la Empresa
                </h4>
                <p class="text-xs text-slate-500">Configure qué módulos y permisos operativos aplican a esta entidad</p>
              </div>

              <!-- Plantillas Rápidas (Presets) -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs text-slate-400 font-medium mr-1">Plantillas:</span>
                <button type="button" class="btn btn-xs btn-outline-secondary" (click)="applyPreset('clinic')" title="Citas médicas activas, sin laboratorio">
                  🩺 Clínica Médica
                </button>
                <button type="button" class="btn btn-xs btn-outline-secondary" (click)="applyPreset('lab')" title="Laboratorio puro con recepción creando estudios">
                  🧪 Laboratorio
                </button>
                <button type="button" class="btn btn-xs btn-outline-secondary" (click)="applyPreset('integral')" title="Todos los módulos y recepción activa">
                  🏥 Centro Integral
                </button>
              </div>
            </div>

            <!-- Switches de Módulos Principales -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <label class="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 cursor-pointer hover:border-blue-400 transition-colors">
                <input type="checkbox" formControlName="moduleScheduling" class="w-4 h-4 mt-0.5 text-blue-600 rounded" />
                <div class="space-y-0.5">
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">📅 Módulo de Agenda y Citas</span>
                  <span class="text-[11px] text-slate-500 block leading-tight">Habilita calendario, horarios de especialistas y reserva de citas.</span>
                </div>
              </label>

              <label class="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 cursor-pointer hover:border-blue-400 transition-colors">
                <input type="checkbox" formControlName="moduleLaboratory" class="w-4 h-4 mt-0.5 text-blue-600 rounded" />
                <div class="space-y-0.5">
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">🔬 Módulo de Laboratorio Clínico</span>
                  <span class="text-[11px] text-slate-500 block leading-tight">Habilita catálogo de estudios, órdenes analíticas y resultados.</span>
                </div>
              </label>
            </div>

            <!-- Políticas Operativas (Condicionadas al Módulo de Laboratorio) -->
            @if (form.get('moduleLaboratory')?.value) {
              <div class="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <span class="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Políticas de Laboratorio:</span>
                <label class="flex items-start gap-3 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 cursor-pointer hover:border-amber-400 transition-colors">
                  <input type="checkbox" formControlName="allowReceptionistStudyOrders" class="w-4 h-4 mt-0.5 text-amber-600 rounded" />
                  <div class="space-y-0.5">
                    <span class="text-xs font-bold text-amber-900 dark:text-amber-200 block">📋 Permitir que Recepcionistas creen Estudios</span>
                    <span class="text-[11px] text-amber-700/80 dark:text-amber-300/80 block leading-tight">
                      Autoriza al rol Recepcionista a crear órdenes de laboratorio directamente desde mostrador/paciente.
                    </span>
                  </div>
                </label>
              </div>
            }
          </div>

          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isActive" formControlName="isActive" class="w-4 h-4 text-blue-600 rounded" />
            <label for="isActive" class="text-sm font-medium text-slate-700 dark:text-slate-300">Empresa Activa en el Sistema</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="form.invalid || saving()" (click)="saveCompany()">
            @if (saving()) {
              <span class="spinner-sm mr-1.5"></span>
            }
            Guardar Empresa
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

  readonly CompanyFeatureKeys = CompanyFeatureKeys;

  readonly companies = signal<CompanyDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly modalOpen = signal<boolean>(false);
  readonly editingCompany = signal<CompanyDto | null>(null);

  readonly columns: TableColumn<CompanyDto>[] = [
    { key: 'name', label: 'Empresa', sortable: true },
    { key: 'taxId', label: 'NIT / Tax ID', sortable: true },
    { key: 'modules', label: 'Módulos Activos' },
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
    isActive: [true],
    moduleScheduling: [true],
    moduleLaboratory: [true],
    allowReceptionistStudyOrders: [true]
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
    this.form.reset({
      isActive: true,
      moduleScheduling: true,
      moduleLaboratory: true,
      allowReceptionistStudyOrders: true
    });
    this.modalOpen.set(true);
  }

  openEditModal(company: CompanyDto): void {
    this.editingCompany.set(company);
    const features = company.features || {};

    this.form.patchValue({
      name: company.name,
      taxId: company.taxId || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      description: company.description || '',
      isActive: company.isActive,
      moduleScheduling: features[CompanyFeatureKeys.ModuleScheduling] ?? true,
      moduleLaboratory: features[CompanyFeatureKeys.ModuleLaboratory] ?? false,
      allowReceptionistStudyOrders: features[CompanyFeatureKeys.AllowReceptionistStudyOrders] ?? false
    });
    this.modalOpen.set(true);
  }

  applyPreset(preset: 'clinic' | 'lab' | 'integral'): void {
    if (preset === 'clinic') {
      this.form.patchValue({
        moduleScheduling: true,
        moduleLaboratory: false,
        allowReceptionistStudyOrders: false
      });
    } else if (preset === 'lab') {
      this.form.patchValue({
        moduleScheduling: false,
        moduleLaboratory: true,
        allowReceptionistStudyOrders: true
      });
    } else if (preset === 'integral') {
      this.form.patchValue({
        moduleScheduling: true,
        moduleLaboratory: true,
        allowReceptionistStudyOrders: true
      });
    }
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

    const features: Record<string, boolean> = {
      [CompanyFeatureKeys.ModuleScheduling]: !!val.moduleScheduling,
      [CompanyFeatureKeys.ModuleLaboratory]: !!val.moduleLaboratory,
      [CompanyFeatureKeys.AllowReceptionistStudyOrders]: !!val.moduleLaboratory && !!val.allowReceptionistStudyOrders
    };

    const payload = {
      name: val.name,
      taxId: val.taxId || null,
      address: val.address || null,
      phone: val.phone || null,
      email: val.email || null,
      description: val.description || null,
      isActive: !!val.isActive,
      features
    };

    if (editing) {
      this.http.put<ApiResponse<CompanyDto>>(`${environment.apiUrl}/companies/${editing.id}`, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success('Empresa y características actualizadas exitosamente.');
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
      this.http.post<ApiResponse<CompanyDto>>(`${environment.apiUrl}/companies`, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Empresa creada exitosamente con sus características.');
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
