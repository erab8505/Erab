import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicalStudyDto, CreateClinicalStudyDto, LabExamDto, StudyCategory, UpdateClinicalStudyDto } from '../../../core/models/models';
import { ClinicalStudyService } from '../../../core/services/clinical-study.service';
import { LabExamService } from '../../../core/services/lab-exam.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

interface SelectedExamRow {
  examId: string;
  code: string;
  name: string;
  sampleType: string;
  method?: string | null;
  parameterCount: number;
}

@Component({
  selector: 'app-clinical-study-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="study ? 'Editar Estudio / Perfil Comercial' : 'Constructor de Estudio / Perfil Comercial'"
      size="xl"
      (closed)="close()">

      <form (ngSubmit)="save()" class="space-y-4 text-xs">
        <!-- Study Basic Info -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label class="form-label">Código del Perfil / Estudio *</label>
            <input
              type="text"
              [(ngModel)]="form.code"
              name="code"
              class="form-control font-mono font-bold uppercase text-xs"
              placeholder="Ej. EST-LIPID, EST-CHECKUP, EST-TIROID"
              required />
          </div>

          <div class="sm:col-span-2">
            <label class="form-label">Nombre Comercial del Estudio / Perfil *</label>
            <input
              type="text"
              [(ngModel)]="form.name"
              name="name"
              class="form-control text-xs font-bold"
              placeholder="Ej. Perfil Lipídico Completo, Check-Up Ejecutivo Masculino..."
              required />
          </div>

          <div>
            <label class="form-label">Categoría *</label>
            <select [(ngModel)]="form.category" name="category" class="form-select text-xs font-semibold">
              <option value="Laboratory">🔬 Laboratorio Clínico</option>
              <option value="ImagingXRay">🩻 Radiología / Rayos X</option>
              <option value="Ultrasound">📡 Ultrasonido / Ecografía</option>
              <option value="Cardiology">🫀 Cardiología</option>
              <option value="Endoscopy">🩺 Endoscopia</option>
              <option value="PathologyBiopsy">🧫 Patología / Biopsia</option>
              <option value="Other">📋 Otros Procedimientos</option>
            </select>
          </div>

          <div>
            <label class="form-label">Precio Base ($) *</label>
            <input
              type="number"
              step="any"
              [(ngModel)]="form.basePrice"
              name="basePrice"
              class="form-control font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs"
              placeholder="0.00"
              required />
          </div>

          <div>
            <label class="form-label">Tiempo de Entrega (Horas)</label>
            <input
              type="number"
              [(ngModel)]="form.turnaroundTimeHours"
              name="turnaroundTimeHours"
              class="form-control font-mono text-xs"
              placeholder="Ej. 24, 48" />
          </div>

          <div class="sm:col-span-3">
            <label class="form-label">Instrucciones de Ayuno y Preparación del Paciente</label>
            <input
              type="text"
              [(ngModel)]="form.preparationInstructions"
              name="preparationInstructions"
              class="form-control text-xs"
              placeholder="Ej. Ayuno estricto de 8 a 12 horas. Primera orina de la mañana en recipiente estéril..." />
          </div>
        </div>

        <!-- EXAM SELECTION SECTION WITH LIVE SEARCH & MULTI-SELECT -->
        <div class="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3 bg-white dark:bg-slate-900">
          <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span class="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>🔬</span> Exámenes Maestros Incluidos en este Estudio
              </span>
              <p class="text-[11px] text-slate-400">
                Seleccione uno o más exámenes analíticos desde el catálogo maestro.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                {{ selectedExams.length }} exámenes ({{ totalAnalytesCount() }} analitos totales)
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Left: Available Exams Pool with Live Search -->
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/40 flex flex-col h-[280px]">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="font-bold text-[11px] text-slate-600 dark:text-slate-300 uppercase">
                  🔍 Banco Maestro de Exámenes
                </span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-1"
                    (click)="selectAllVisible()">
                    + Todos
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    class="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline px-1"
                    (click)="deselectAll()">
                    Quitar todo
                  </button>
                </div>
              </div>

              <!-- Search Box -->
              <input
                type="text"
                [(ngModel)]="examSearch"
                [ngModelOptions]="{standalone: true}"
                class="form-control text-xs py-1 mb-2"
                placeholder="Filtrar por código, nombre o muestra..." />

              <!-- Scrollable Available Exams Checklist -->
              <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
                @for (e of filteredAvailableExams(); track e.id) {
                  <label
                    class="flex items-start gap-2 p-2 rounded-lg border transition-all cursor-pointer select-none text-xs"
                    [class.bg-blue-50]="isExamSelected(e.id)"
                    [class.border-blue-300]="isExamSelected(e.id)"
                    [class.dark:bg-blue-950/40]="isExamSelected(e.id)"
                    [class.bg-white]="!isExamSelected(e.id)"
                    [class.dark:bg-slate-800]="!isExamSelected(e.id)"
                    [class.border-slate-200]="!isExamSelected(e.id)"
                    [class.dark:border-slate-700]="!isExamSelected(e.id)">

                    <input
                      type="checkbox"
                      [checked]="isExamSelected(e.id)"
                      (change)="toggleExam(e)"
                      class="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-1">
                        <span class="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {{ e.name }}
                        </span>
                        <span class="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-600 dark:text-slate-300 shrink-0">
                          {{ e.code }}
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span class="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-1 rounded font-semibold">
                          {{ e.parameters.length }} analitos
                        </span>
                        <span>•</span>
                        <span>{{ e.sampleTypeName || e.sampleType }}</span>
                        @if (e.method) {
                          <span>•</span>
                          <span>{{ e.method }}</span>
                        }
                      </div>
                    </div>
                  </label>
                } @empty {
                  <div class="text-center py-8 text-slate-400 text-xs">
                    No se encontraron exámenes con "{{ examSearch }}".
                  </div>
                }
              </div>
            </div>

            <!-- Right: Selected Exams Ordering List -->
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/40 flex flex-col h-[280px]">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="font-bold text-[11px] text-slate-600 dark:text-slate-300 uppercase">
                  📋 Exámenes que Componen el Perfil
                </span>
                <span class="text-[10px] text-slate-400">Usa ▲ ▼ para ordenar</span>
              </div>

              <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
                @for (item of selectedExams; track item.examId; let idx = $index) {
                  <div class="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between gap-2 shadow-xs">
                    <div class="flex items-center gap-1.5 min-w-0 flex-1">
                      <span class="font-mono text-[10px] font-bold text-slate-400 w-4">{{ idx + 1 }}.</span>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1">
                          <span class="font-bold text-slate-800 dark:text-slate-100 truncate">{{ item.name }}</span>
                          <span class="text-[10px] text-slate-400 font-mono">({{ item.code }})</span>
                        </div>
                        <div class="text-[10px] text-slate-500">
                          {{ item.parameterCount }} analitos • Muestra: {{ item.sampleType }}
                        </div>
                      </div>
                    </div>

                    <!-- Actions: Reorder and Remove -->
                    <div class="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-30"
                        [disabled]="idx === 0"
                        (click)="moveUp(idx)"
                        title="Subir">
                        ▲
                      </button>
                      <button
                        type="button"
                        class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-30"
                        [disabled]="idx === selectedExams.length - 1"
                        (click)="moveDown(idx)"
                        title="Bajar">
                        ▼
                      </button>
                      <button
                        type="button"
                        class="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded text-rose-500 font-bold ml-1"
                        (click)="removeExam(idx)"
                        title="Quitar examen">
                        ✕
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <span>👈 Seleccione uno o más exámenes del panel izquierdo.</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" class="btn btn-secondary" (click)="close()">Cancelar</button>
          <button type="submit" class="btn btn-primary font-bold" [disabled]="saving || !form.code || !form.name || selectedExams.length === 0">
            @if (saving) {
              <span class="spinner-sm mr-1.5"></span>
            }
            {{ study ? 'Guardar Cambios del Estudio' : 'Crear Estudio / Perfil' }}
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class ClinicalStudyModalComponent implements OnInit, OnChanges {
  private readonly studyService = inject(ClinicalStudyService);
  private readonly examService = inject(LabExamService);
  private readonly toast = inject(ToastService);

  @Input() isOpen = false;
  @Input() study: ClinicalStudyDto | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ClinicalStudyDto>();

  readonly allExams = signal<LabExamDto[]>([]);
  selectedExams: SelectedExamRow[] = [];
  examSearch = '';
  saving = false;

  form: CreateClinicalStudyDto = {
    code: '',
    name: '',
    description: '',
    category: 'Laboratory',
    basePrice: 0,
    preparationInstructions: '',
    turnaroundTimeHours: null,
    exams: []
  };

  ngOnInit(): void {
    this.loadExams();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.loadExams();
      this.examSearch = '';
      if (this.study) {
        this.form = {
          code: this.study.code,
          name: this.study.name,
          description: this.study.description || '',
          category: this.study.category,
          basePrice: this.study.basePrice,
          preparationInstructions: this.study.preparationInstructions || '',
          turnaroundTimeHours: this.study.turnaroundTimeHours,
          exams: []
        };
        this.selectedExams = (this.study.exams || []).map(e => ({
          examId: e.labExamId,
          code: e.examCode,
          name: e.examName,
          sampleType: e.sampleTypeName || e.sampleType.toString(),
          method: e.method,
          parameterCount: e.parameters?.length || 0
        }));
      } else {
        this.form = {
          code: '',
          name: '',
          description: '',
          category: 'Laboratory',
          basePrice: 0,
          preparationInstructions: '',
          turnaroundTimeHours: null,
          exams: []
        };
        this.selectedExams = [];
      }
    }
  }

  loadExams(): void {
    this.examService.getAll(undefined, true).subscribe(res => {
      this.allExams.set(res.data || []);
    });
  }

  filteredAvailableExams(): LabExamDto[] {
    let list = this.allExams();
    const q = this.examSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(e => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || (e.method && e.method.toLowerCase().includes(q)));
    }
    return list;
  }

  isExamSelected(id: string): boolean {
    return this.selectedExams.some(e => e.examId === id);
  }

  toggleExam(e: LabExamDto): void {
    const idx = this.selectedExams.findIndex(x => x.examId === e.id);
    if (idx >= 0) {
      this.selectedExams.splice(idx, 1);
    } else {
      this.selectedExams.push({
        examId: e.id,
        code: e.code,
        name: e.name,
        sampleType: e.sampleTypeName || e.sampleType.toString(),
        method: e.method,
        parameterCount: e.parameters?.length || 0
      });
    }
  }

  selectAllVisible(): void {
    for (const e of this.filteredAvailableExams()) {
      if (!this.isExamSelected(e.id)) {
        this.selectedExams.push({
          examId: e.id,
          code: e.code,
          name: e.name,
          sampleType: e.sampleTypeName || e.sampleType.toString(),
          method: e.method,
          parameterCount: e.parameters?.length || 0
        });
      }
    }
  }

  deselectAll(): void {
    this.selectedExams = [];
  }

  moveUp(index: number): void {
    if (index <= 0) return;
    const temp = this.selectedExams[index];
    this.selectedExams[index] = this.selectedExams[index - 1];
    this.selectedExams[index - 1] = temp;
  }

  moveDown(index: number): void {
    if (index >= this.selectedExams.length - 1) return;
    const temp = this.selectedExams[index];
    this.selectedExams[index] = this.selectedExams[index + 1];
    this.selectedExams[index + 1] = temp;
  }

  removeExam(index: number): void {
    this.selectedExams.splice(index, 1);
  }

  totalAnalytesCount(): number {
    return this.selectedExams.reduce((sum, e) => sum + e.parameterCount, 0);
  }

  save(): void {
    if (!this.form.code.trim() || !this.form.name.trim()) {
      this.toast.error('Código y nombre del estudio son requeridos.');
      return;
    }

    if (this.selectedExams.length === 0) {
      this.toast.error('Debe seleccionar al menos un examen para el estudio.');
      return;
    }

    this.form.exams = this.selectedExams.map((e, idx) => ({
      labExamId: e.examId,
      sortOrder: idx + 1
    }));

    this.saving = true;

    if (this.study) {
      const updateDto: UpdateClinicalStudyDto = {
        ...this.form,
        isActive: this.study.isActive
      };

      this.studyService.update(this.study.id, updateDto).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success && res.data) {
            this.toast.success('Estudio clínico actualizado exitosamente.');
            this.saved.emit(res.data);
            this.close();
          } else {
            this.toast.error(res.message || 'Error al actualizar estudio.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Error al guardar estudio.');
        }
      });
    } else {
      this.studyService.create(this.form).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success && res.data) {
            this.toast.success('Estudio clínico creado exitosamente.');
            this.saved.emit(res.data);
            this.close();
          } else {
            this.toast.error(res.message || 'Error al crear estudio.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Error al crear estudio.');
        }
      });
    }
  }

  close(): void {
    this.closed.emit();
  }
}
