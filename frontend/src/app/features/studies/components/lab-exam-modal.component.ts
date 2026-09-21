import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateLabExamDto, CreateLabExamParameterDto, LabExamDto, LabParameterDto, SampleType, UpdateLabExamDto } from '../../../core/models/models';
import { LabExamService } from '../../../core/services/lab-exam.service';
import { LabParameterService } from '../../../core/services/lab-parameter.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

interface SelectedParamRow {
  parameterId: string;
  code: string;
  name: string;
  unit?: string | null;
  valueType: string;
  defaultMin?: number | null;
  defaultMax?: number | null;
  defaultText?: string | null;
  customMin?: number | null;
  customMax?: number | null;
  customText?: string | null;
}

@Component({
  selector: 'app-lab-exam-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="exam ? 'Editar Examen Analítico' : 'Constructor de Examen Analítico'"
      size="xl"
      (closed)="close()">

      <form (ngSubmit)="save()" class="space-y-4 text-xs">
        <!-- Basic Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label class="form-label">Código del Examen *</label>
            <input
              type="text"
              [(ngModel)]="form.code"
              name="code"
              class="form-control font-mono font-bold uppercase text-xs"
              placeholder="Ej. EX-BH, EX-QS6, EX-LIPID"
              required />
          </div>

          <div class="sm:col-span-2">
            <label class="form-label">Nombre del Examen *</label>
            <input
              type="text"
              [(ngModel)]="form.name"
              name="name"
              class="form-control text-xs font-bold"
              placeholder="Ej. Biometría Hemática Completa, Química Sanguínea 6 Elementos..."
              required />
          </div>

          <div>
            <label class="form-label">Tipo de Muestra *</label>
            <select [(ngModel)]="form.sampleType" name="sampleType" class="form-select text-xs font-semibold">
              <option value="VenousBlood">🩸 Sangre Venosa (Suero / Plasma)</option>
              <option value="ArterialBlood">🩸 Sangre Arterial</option>
              <option value="Urine">🟡 Orina (Espécimen Simple / 24h)</option>
              <option value="Stool">💩 Materia Fecal</option>
              <option value="Sputum">🧫 Esputo / Secreción</option>
              <option value="Biopsy">🔬 Biopsia / Tejido</option>
              <option value="Swab">🧪 Hisopado / Exudado</option>
              <option value="Other">📦 Otra Muestra</option>
            </select>
          </div>

          <div>
            <label class="form-label">Método Analítico</label>
            <input
              type="text"
              [(ngModel)]="form.method"
              name="method"
              class="form-control text-xs"
              placeholder="Ej. Citometría de Flujo, Espectrofotometría, ELISA..." />
          </div>

          <div>
            <label class="form-label">Tiempo de Entrega (Horas)</label>
            <input
              type="number"
              [(ngModel)]="form.turnaroundHours"
              name="turnaroundHours"
              class="form-control font-mono text-xs"
              placeholder="Ej. 2, 24, 48" />
          </div>
        </div>

        <!-- PARAMETER SELECTION SECTION WITH LIVE SEARCH & MULTI-SELECT -->
        <div class="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3 bg-white dark:bg-slate-900">
          <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span class="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>📊</span> Analitos y Parámetros del Examen
              </span>
              <p class="text-[11px] text-slate-400">
                Seleccione los analitos que componen este examen desde el banco maestro de parámetros.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                {{ selectedParameters.length }} analitos asignados
              </span>
            </div>
          </div>

          <!-- Live Search and Parameter Picker Toolbar -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Left: Available Parameters Live Search & Multi-Select Pool -->
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/40 flex flex-col h-[280px]">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="font-bold text-[11px] text-slate-600 dark:text-slate-300 uppercase">
                  🔍 Banco Maestro de Parámetros
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
                [(ngModel)]="paramSearch"
                [ngModelOptions]="{standalone: true}"
                class="form-control text-xs py-1 mb-2"
                placeholder="Filtrar por código, nombre o unidad..." />

              <!-- Scrollable Available Items Checklist -->
              <div class="flex-1 overflow-y-auto space-y-1 pr-1">
                @for (p of filteredAvailableParameters(); track p.id) {
                  <label
                    class="flex items-center gap-2 p-1.5 rounded-lg border transition-all cursor-pointer select-none text-xs"
                    [class.bg-blue-50]="isParamSelected(p.id)"
                    [class.border-blue-300]="isParamSelected(p.id)"
                    [class.dark:bg-blue-950/40]="isParamSelected(p.id)"
                    [class.bg-white]="!isParamSelected(p.id)"
                    [class.dark:bg-slate-800]="!isParamSelected(p.id)"
                    [class.border-slate-200]="!isParamSelected(p.id)"
                    [class.dark:border-slate-700]="!isParamSelected(p.id)">

                    <input
                      type="checkbox"
                      [checked]="isParamSelected(p.id)"
                      (change)="toggleParam(p)"
                      class="rounded text-blue-600 focus:ring-blue-500" />

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-1">
                        <span class="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {{ p.name }}
                        </span>
                        <span class="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-600 dark:text-slate-300 shrink-0">
                          {{ p.code }}
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>{{ p.unit || 'Sin unidad' }}</span>
                        <span>•</span>
                        <span>{{ p.valueType }}</span>
                        @if (p.defaultReferenceMin != null || p.defaultReferenceMax != null) {
                          <span>• [{{ p.defaultReferenceMin ?? 0 }} - {{ p.defaultReferenceMax ?? 'N/A' }}]</span>
                        }
                      </div>
                    </div>
                  </label>
                } @empty {
                  <div class="text-center py-6 text-slate-400 text-xs">
                    No se encontraron parámetros con "{{ paramSearch }}".
                  </div>
                }
              </div>
            </div>

            <!-- Right: Selected Parameters Ordering & Overrides -->
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/40 flex flex-col h-[280px]">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="font-bold text-[11px] text-slate-600 dark:text-slate-300 uppercase">
                  📋 Estructura y Secuencia en el Reporte
                </span>
                <span class="text-[10px] text-slate-400">Usa ▲ ▼ para ordenar</span>
              </div>

              <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
                @for (item of selectedParameters; track item.parameterId; let idx = $index) {
                  <div class="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between gap-2 shadow-xs">
                    <div class="flex items-center gap-1.5 min-w-0 flex-1">
                      <span class="font-mono text-[10px] font-bold text-slate-400 w-4">{{ idx + 1 }}.</span>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1">
                          <span class="font-bold text-slate-800 dark:text-slate-100 truncate">{{ item.name }}</span>
                          <span class="text-[10px] text-slate-400 font-mono">({{ item.code }})</span>
                        </div>
                        <div class="text-[10px] text-slate-500">
                          Ref: {{ item.customMin != null || item.customMax != null ? (item.customMin ?? 0) + ' - ' + (item.customMax ?? 'N/A') : (item.defaultMin != null || item.defaultMax != null ? (item.defaultMin ?? 0) + ' - ' + (item.defaultMax ?? 'N/A') : item.defaultText || 'N/A') }} {{ item.unit }}
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
                        [disabled]="idx === selectedParameters.length - 1"
                        (click)="moveDown(idx)"
                        title="Bajar">
                        ▼
                      </button>
                      <button
                        type="button"
                        class="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded text-rose-500 font-bold ml-1"
                        (click)="removeParam(idx)"
                        title="Quitar analito">
                        ✕
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <span>👈 Seleccione uno o más analitos del panel izquierdo.</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" class="btn btn-secondary" (click)="close()">Cancelar</button>
          <button type="submit" class="btn btn-primary font-bold" [disabled]="saving || !form.code || !form.name || selectedParameters.length === 0">
            @if (saving) {
              <span class="spinner-sm mr-1.5"></span>
            }
            {{ exam ? 'Guardar Cambios del Examen' : 'Crear Examen Analítico' }}
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class LabExamModalComponent implements OnInit, OnChanges {
  private readonly examService = inject(LabExamService);
  private readonly parameterService = inject(LabParameterService);
  private readonly toast = inject(ToastService);

  @Input() isOpen = false;
  @Input() exam: LabExamDto | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<LabExamDto>();

  readonly allParameters = signal<LabParameterDto[]>([]);
  selectedParameters: SelectedParamRow[] = [];
  paramSearch = '';
  saving = false;

  form: CreateLabExamDto = {
    code: '',
    name: '',
    description: '',
    sampleType: 'VenousBlood',
    method: '',
    turnaroundHours: null,
    parameters: []
  };

  ngOnInit(): void {
    this.loadParameters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.loadParameters();
      this.paramSearch = '';
      if (this.exam) {
        this.form = {
          code: this.exam.code,
          name: this.exam.name,
          description: this.exam.description || '',
          sampleType: this.exam.sampleType,
          method: this.exam.method || '',
          turnaroundHours: this.exam.turnaroundHours,
          parameters: []
        };
        this.selectedParameters = (this.exam.parameters || []).map(p => ({
          parameterId: p.labParameterId,
          code: p.parameterCode,
          name: p.parameterName,
          unit: p.unit,
          valueType: p.valueType,
          defaultMin: p.referenceRangeMin,
          defaultMax: p.referenceRangeMax,
          defaultText: p.referenceText,
          customMin: p.referenceRangeMin,
          customMax: p.referenceRangeMax,
          customText: p.referenceText
        }));
      } else {
        this.form = {
          code: '',
          name: '',
          description: '',
          sampleType: 'VenousBlood',
          method: '',
          turnaroundHours: null,
          parameters: []
        };
        this.selectedParameters = [];
      }
    }
  }

  loadParameters(): void {
    this.parameterService.getAll(undefined, true).subscribe(res => {
      this.allParameters.set(res.data || []);
    });
  }

  filteredAvailableParameters(): LabParameterDto[] {
    let list = this.allParameters();
    const q = this.paramSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.unit && p.unit.toLowerCase().includes(q)));
    }
    return list;
  }

  isParamSelected(id: string): boolean {
    return this.selectedParameters.some(p => p.parameterId === id);
  }

  toggleParam(p: LabParameterDto): void {
    const idx = this.selectedParameters.findIndex(x => x.parameterId === p.id);
    if (idx >= 0) {
      this.selectedParameters.splice(idx, 1);
    } else {
      this.selectedParameters.push({
        parameterId: p.id,
        code: p.code,
        name: p.name,
        unit: p.unit,
        valueType: p.valueType,
        defaultMin: p.defaultReferenceMin,
        defaultMax: p.defaultReferenceMax,
        defaultText: p.defaultReferenceText,
        customMin: null,
        customMax: null,
        customText: null
      });
    }
  }

  selectAllVisible(): void {
    for (const p of this.filteredAvailableParameters()) {
      if (!this.isParamSelected(p.id)) {
        this.selectedParameters.push({
          parameterId: p.id,
          code: p.code,
          name: p.name,
          unit: p.unit,
          valueType: p.valueType,
          defaultMin: p.defaultReferenceMin,
          defaultMax: p.defaultReferenceMax,
          defaultText: p.defaultReferenceText,
          customMin: null,
          customMax: null,
          customText: null
        });
      }
    }
  }

  deselectAll(): void {
    this.selectedParameters = [];
  }

  moveUp(index: number): void {
    if (index <= 0) return;
    const temp = this.selectedParameters[index];
    this.selectedParameters[index] = this.selectedParameters[index - 1];
    this.selectedParameters[index - 1] = temp;
  }

  moveDown(index: number): void {
    if (index >= this.selectedParameters.length - 1) return;
    const temp = this.selectedParameters[index];
    this.selectedParameters[index] = this.selectedParameters[index + 1];
    this.selectedParameters[index + 1] = temp;
  }

  removeParam(index: number): void {
    this.selectedParameters.splice(index, 1);
  }

  save(): void {
    if (!this.form.code.trim() || !this.form.name.trim()) {
      this.toast.error('Código y nombre del examen son requeridos.');
      return;
    }

    if (this.selectedParameters.length === 0) {
      this.toast.error('Debe seleccionar al menos un parámetro / analito para el examen.');
      return;
    }

    this.form.parameters = this.selectedParameters.map((p, idx) => ({
      labParameterId: p.parameterId,
      sortOrder: idx + 1,
      customReferenceMin: p.customMin,
      customReferenceMax: p.customMax,
      customReferenceText: p.customText
    }));

    this.saving = true;

    if (this.exam) {
      const updateDto: UpdateLabExamDto = {
        ...this.form,
        isActive: this.exam.isActive
      };

      this.examService.update(this.exam.id, updateDto).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success && res.data) {
            this.toast.success('Examen analítico actualizado exitosamente.');
            this.saved.emit(res.data);
            this.close();
          } else {
            this.toast.error(res.message || 'Error al actualizar examen.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Error al guardar examen.');
        }
      });
    } else {
      this.examService.create(this.form).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success && res.data) {
            this.toast.success('Examen analítico creado exitosamente.');
            this.saved.emit(res.data);
            this.close();
          } else {
            this.toast.error(res.message || 'Error al crear examen.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Error al crear examen.');
        }
      });
    }
  }

  close(): void {
    this.closed.emit();
  }
}
