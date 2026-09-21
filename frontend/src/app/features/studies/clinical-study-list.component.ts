import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ClinicalStudyDto,
  LabExamDto,
  LabParameterDto,
  StudyCategory
} from '../../core/models/models';
import { ClinicalStudyService } from '../../core/services/clinical-study.service';
import { LabExamService } from '../../core/services/lab-exam.service';
import { LabParameterService } from '../../core/services/lab-parameter.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ClinicalStudyModalComponent } from './components/clinical-study-modal.component';
import { LabExamModalComponent } from './components/lab-exam-modal.component';
import { LabParameterModalComponent } from './components/lab-parameter-modal.component';

@Component({
  selector: 'app-clinical-study-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DataTableComponent,
    BadgeComponent,
    ClinicalStudyModalComponent,
    LabExamModalComponent,
    LabParameterModalComponent
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <a routerLink="/studies" class="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              &larr; Volver al Panel de Órdenes de Laboratorio
            </a>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>🔬</span> Catálogo Modular de Laboratorio y Estudios
          </h1>
          <p class="text-slate-500 text-sm">
            Configure parámetros reutilizables, ensamble exámenes analíticos y defina perfiles de estudios clínicos.
          </p>
        </div>

        <div class="header-actions">
          @if (activeTab() === 'studies') {
            <button type="button" class="btn btn-primary font-bold" (click)="openCreateStudyModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Nuevo Estudio / Perfil
            </button>
          } @else if (activeTab() === 'exams') {
            <button type="button" class="btn btn-primary font-bold" (click)="openCreateExamModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Nuevo Examen Analítico
            </button>
          } @else {
            <button type="button" class="btn btn-primary font-bold" (click)="openCreateParamModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Nuevo Parámetro / Analito
            </button>
          }
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tab-nav flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
        <button
          type="button"
          class="tab-btn font-semibold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5"
          [class.bg-blue-600]="activeTab() === 'studies'"
          [class.text-white]="activeTab() === 'studies'"
          [class.bg-slate-100]="activeTab() !== 'studies'"
          [class.dark:bg-slate-800]="activeTab() !== 'studies'"
          [class.text-slate-600]="activeTab() !== 'studies'"
          [class.dark:text-slate-300]="activeTab() !== 'studies'"
          (click)="setTab('studies')">
          <span>🧪</span> Estudios / Perfiles Comerciales ({{ studies().length }})
        </button>

        <button
          type="button"
          class="tab-btn font-semibold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5"
          [class.bg-blue-600]="activeTab() === 'exams'"
          [class.text-white]="activeTab() === 'exams'"
          [class.bg-slate-100]="activeTab() !== 'exams'"
          [class.dark:bg-slate-800]="activeTab() !== 'exams'"
          [class.text-slate-600]="activeTab() !== 'exams'"
          [class.dark:text-slate-300]="activeTab() !== 'exams'"
          (click)="setTab('exams')">
          <span>🔬</span> Catálogo de Exámenes ({{ exams().length }})
        </button>

        <button
          type="button"
          class="tab-btn font-semibold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5"
          [class.bg-blue-600]="activeTab() === 'parameters'"
          [class.text-white]="activeTab() === 'parameters'"
          [class.bg-slate-100]="activeTab() !== 'parameters'"
          [class.dark:bg-slate-800]="activeTab() !== 'parameters'"
          [class.text-slate-600]="activeTab() !== 'parameters'"
          [class.dark:text-slate-300]="activeTab() !== 'parameters'"
          (click)="setTab('parameters')">
          <span>📊</span> Banco de Parámetros / Analitos ({{ parameters().length }})
        </button>
      </div>

      <!-- TAB 1: CLINICAL STUDIES / PACKAGES -->
      @if (activeTab() === 'studies') {
        <app-data-table
          [columns]="studyColumns"
          [data]="filteredStudies()"
          [loading]="loading()">

          <ng-template #cellTemplate let-item let-col="column">
            @switch (col.key) {
              @case ('code') {
                <span class="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded border border-slate-200 dark:border-slate-700">
                  {{ item.code }}
                </span>
              }
              @case ('category') {
                <span class="text-xs font-semibold">
                  {{ getCategoryLabel(item.category) }}
                </span>
              }
              @case ('basePrice') {
                <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  $ {{ item.basePrice | number:'1.2-2' }}
                </span>
              }
              @case ('exams') {
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {{ item.exams?.length || 0 }} {{ (item.exams?.length === 1) ? 'examen' : 'exámenes' }}
                  </span>
                  <span class="text-[10px] text-slate-400">
                    ({{ getStudyAnalytesCount(item) }} analitos)
                  </span>
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
              <button
                type="button"
                class="btn btn-secondary btn-sm text-xs font-semibold text-blue-600"
                (click)="openEditStudyModal(item)">
                ✏️ Editar
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm text-xs text-rose-600"
                (click)="deleteStudy(item)">
                🗑️
              </button>
            </div>
          </ng-template>
        </app-data-table>
      }

      <!-- TAB 2: REUSABLE LAB EXAMS -->
      @if (activeTab() === 'exams') {
        <app-data-table
          [columns]="examColumns"
          [data]="filteredExams()"
          [loading]="loading()">

          <ng-template #cellTemplate let-item let-col="column">
            @switch (col.key) {
              @case ('code') {
                <span class="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded border border-slate-200 dark:border-slate-700">
                  {{ item.code }}
                </span>
              }
              @case ('sampleType') {
                <span class="text-xs font-medium flex items-center gap-1">
                  🩸 {{ item.sampleTypeName || item.sampleType }}
                </span>
              }
              @case ('parameters') {
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {{ item.parameters?.length || 0 }} analitos incluidos
                </span>
              }
              @case ('turnaroundHours') {
                <span class="text-xs text-slate-600 dark:text-slate-300">
                  {{ item.turnaroundHours ? item.turnaroundHours + ' hrs' : '-' }}
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
            <div class="flex items-center justify-end gap-1.5">
              <button
                type="button"
                class="btn btn-secondary btn-sm text-xs font-semibold text-blue-600"
                (click)="openEditExamModal(item)">
                ✏️ Editar
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm text-xs text-rose-600"
                (click)="deleteExam(item)">
                🗑️
              </button>
            </div>
          </ng-template>
        </app-data-table>
      }

      <!-- TAB 3: REUSABLE LAB PARAMETERS -->
      @if (activeTab() === 'parameters') {
        <app-data-table
          [columns]="parameterColumns"
          [data]="filteredParameters()"
          [loading]="loading()">

          <ng-template #cellTemplate let-item let-col="column">
            @switch (col.key) {
              @case ('code') {
                <span class="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded border border-slate-200 dark:border-slate-700">
                  {{ item.code }}
                </span>
              }
              @case ('unit') {
                <span class="font-mono text-xs text-slate-600 dark:text-slate-300">
                  {{ item.unit || '-' }}
                </span>
              }
              @case ('valueType') {
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {{ item.valueTypeName || item.valueType }}
                </span>
              }
              @case ('defaultRange') {
                <span class="text-xs font-mono text-slate-700 dark:text-slate-300">
                  {{ item.defaultReferenceText || (item.defaultReferenceMin != null || item.defaultReferenceMax != null ? (item.defaultReferenceMin ?? 0) + ' - ' + (item.defaultReferenceMax ?? 'N/A') : '-') }}
                </span>
              }
              @case ('defaultReagentName') {
                <span class="text-xs text-slate-500">
                  {{ item.defaultReagentName ? item.defaultReagentName + (item.defaultReagentQuantity ? ' (' + item.defaultReagentQuantity + ')' : '') : '-' }}
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
            <div class="flex items-center justify-end gap-1.5">
              <button
                type="button"
                class="btn btn-secondary btn-sm text-xs font-semibold text-blue-600"
                (click)="openEditParamModal(item)">
                ✏️ Editar
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm text-xs text-rose-600"
                (click)="deleteParameter(item)">
                🗑️
              </button>
            </div>
          </ng-template>
        </app-data-table>
      }

      <!-- Modals -->
      <app-clinical-study-modal
        [isOpen]="studyModalOpen()"
        [study]="selectedStudy()"
        (closed)="closeStudyModal()"
        (saved)="loadAll()">
      </app-clinical-study-modal>

      <app-lab-exam-modal
        [isOpen]="examModalOpen()"
        [exam]="selectedExam()"
        (closed)="closeExamModal()"
        (saved)="loadAll()">
      </app-lab-exam-modal>

      <app-lab-parameter-modal
        [isOpen]="paramModalOpen()"
        [parameter]="selectedParam()"
        (closed)="closeParamModal()"
        (saved)="loadAll()">
      </app-lab-parameter-modal>
    </div>
  `
})
export class ClinicalStudyListComponent implements OnInit {
  private readonly studyService = inject(ClinicalStudyService);
  private readonly examService = inject(LabExamService);
  private readonly paramService = inject(LabParameterService);
  private readonly toast = inject(ToastService);

  readonly activeTab = signal<'studies' | 'exams' | 'parameters'>('studies');
  readonly loading = signal<boolean>(false);

  readonly studies = signal<ClinicalStudyDto[]>([]);
  readonly exams = signal<LabExamDto[]>([]);
  readonly parameters = signal<LabParameterDto[]>([]);

  // Modals signals
  readonly studyModalOpen = signal<boolean>(false);
  readonly selectedStudy = signal<ClinicalStudyDto | null>(null);

  readonly examModalOpen = signal<boolean>(false);
  readonly selectedExam = signal<LabExamDto | null>(null);

  readonly paramModalOpen = signal<boolean>(false);
  readonly selectedParam = signal<LabParameterDto | null>(null);

  readonly studyColumns: TableColumn[] = [
    { key: 'code', label: 'Código', width: '120px' },
    { key: 'name', label: 'Estudio / Perfil', sortable: true },
    { key: 'category', label: 'Categoría', width: '150px' },
    { key: 'exams', label: 'Exámenes Incluidos', width: '180px' },
    { key: 'basePrice', label: 'Precio Base', width: '120px', align: 'right' },
    { key: 'isActive', label: 'Estado', width: '100px', align: 'center' }
  ];

  readonly examColumns: TableColumn[] = [
    { key: 'code', label: 'Código', width: '120px' },
    { key: 'name', label: 'Nombre del Examen', sortable: true },
    { key: 'sampleType', label: 'Muestra', width: '160px' },
    { key: 'method', label: 'Método', width: '160px' },
    { key: 'parameters', label: 'Analitos', width: '160px' },
    { key: 'turnaroundHours', label: 'Entrega', width: '100px' },
    { key: 'isActive', label: 'Estado', width: '100px', align: 'center' }
  ];

  readonly parameterColumns: TableColumn[] = [
    { key: 'code', label: 'Código', width: '110px' },
    { key: 'name', label: 'Nombre del Analito', sortable: true },
    { key: 'unit', label: 'Unidad', width: '90px' },
    { key: 'valueType', label: 'Tipo', width: '120px' },
    { key: 'defaultRange', label: 'Rango por Defecto', width: '160px' },
    { key: 'defaultReagentName', label: 'Reactivo / Gasto', width: '160px' },
    { key: 'isActive', label: 'Estado', width: '100px', align: 'center' }
  ];

  ngOnInit(): void {
    this.loadAll();
  }

  setTab(tab: 'studies' | 'exams' | 'parameters'): void {
    this.activeTab.set(tab);
  }

  loadAll(): void {
    this.loading.set(true);
    this.studyService.getAll().subscribe({
      next: (res) => this.studies.set(res.data || [])
    });

    this.examService.getAll().subscribe({
      next: (res) => this.exams.set(res.data || [])
    });

    this.paramService.getAll().subscribe({
      next: (res) => {
        this.parameters.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredStudies(): ClinicalStudyDto[] {
    return this.studies();
  }

  filteredExams(): LabExamDto[] {
    return this.exams();
  }

  filteredParameters(): LabParameterDto[] {
    return this.parameters();
  }

  getStudyAnalytesCount(study: ClinicalStudyDto): number {
    return (study.exams || []).reduce((sum, e) => sum + (e.parameters?.length || 0), 0);
  }

  getCategoryLabel(category?: StudyCategory): string {
    switch (category) {
      case 'Laboratory': return '🔬 Laboratorio';
      case 'ImagingXRay': return '🩻 Radiología / Rayos X';
      case 'Ultrasound': return '📡 Ultrasonido / Ecografía';
      case 'Cardiology': return '🫀 Cardiología';
      case 'Endoscopy': return '🩺 Endoscopia';
      case 'PathologyBiopsy': return '🧫 Patología / Biopsia';
      default: return '📋 Procedimiento';
    }
  }

  // Study Modal handlers
  openCreateStudyModal(): void {
    this.selectedStudy.set(null);
    this.studyModalOpen.set(true);
  }

  openEditStudyModal(study: ClinicalStudyDto): void {
    this.selectedStudy.set(study);
    this.studyModalOpen.set(true);
  }

  closeStudyModal(): void {
    this.studyModalOpen.set(false);
  }

  deleteStudy(study: ClinicalStudyDto): void {
    if (confirm(`¿Está seguro de eliminar o desactivar el estudio "${study.name}"?`)) {
      this.studyService.delete(study.id).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Estudio eliminado/desactivado.');
          this.loadAll();
        },
        error: (err) => this.toast.error(err?.error?.message || 'Error al eliminar estudio.')
      });
    }
  }

  // Exam Modal handlers
  openCreateExamModal(): void {
    this.selectedExam.set(null);
    this.examModalOpen.set(true);
  }

  openEditExamModal(exam: LabExamDto): void {
    this.selectedExam.set(exam);
    this.examModalOpen.set(true);
  }

  closeExamModal(): void {
    this.examModalOpen.set(false);
  }

  deleteExam(exam: LabExamDto): void {
    if (confirm(`¿Está seguro de eliminar o desactivar el examen "${exam.name}"?`)) {
      this.examService.delete(exam.id).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Examen eliminado/desactivado.');
          this.loadAll();
        },
        error: (err) => this.toast.error(err?.error?.message || 'Error al eliminar examen.')
      });
    }
  }

  // Param Modal handlers
  openCreateParamModal(): void {
    this.selectedParam.set(null);
    this.paramModalOpen.set(true);
  }

  openEditParamModal(param: LabParameterDto): void {
    this.selectedParam.set(param);
    this.paramModalOpen.set(true);
  }

  closeParamModal(): void {
    this.paramModalOpen.set(false);
  }

  deleteParameter(param: LabParameterDto): void {
    if (confirm(`¿Está seguro de eliminar o desactivar el analito "${param.name}"?`)) {
      this.paramService.delete(param.id).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Parámetro eliminado/desactivado.');
          this.loadAll();
        },
        error: (err) => this.toast.error(err?.error?.message || 'Error al eliminar parámetro.')
      });
    }
  }
}
