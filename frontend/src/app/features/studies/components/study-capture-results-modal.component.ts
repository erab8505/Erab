import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveParameterResultDto, SaveStudyResultsDto, StudyOrderDto, StudyOrderItemDto, StudyOrderResultDto } from '../../../core/models/models';
import { StudyOrderService } from '../../../core/services/study-order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-study-capture-results-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="Captura y Validación de Resultados de Estudio"
      size="xl"
      (closed)="close()">

      @if (order) {
        <div class="space-y-4">
          <!-- Patient and Order Header Summary -->
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                  {{ order.orderNumber }}
                </span>
                <span class="text-sm font-bold text-slate-800 dark:text-slate-100">
                  👤 {{ order.patientName }}
                </span>
                @if (order.patientDocumentId) {
                  <span class="text-xs text-slate-500 font-mono">
                    (Doc: {{ order.patientDocumentId }})
                  </span>
                }
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Fecha: {{ order.orderDate | date:'dd/MM/yyyy HH:mm' }} • Solicitante: {{ order.specialistName || 'Recepción / Consulta' }}
              </p>
            </div>

            <div class="text-right">
              <span class="text-[11px] font-bold text-slate-400 block uppercase">Estado de la Orden</span>
              <span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                [class.bg-amber-100]="order.status === 'Requested' || order.status === 'SampleCollected' || order.status === 'InAnalysis'"
                [class.text-amber-800]="order.status === 'Requested' || order.status === 'SampleCollected' || order.status === 'InAnalysis'"
                [class.bg-emerald-100]="order.status === 'Completed' || order.status === 'Delivered'"
                [class.text-emerald-800]="order.status === 'Completed' || order.status === 'Delivered'">
                {{ getStatusLabel(order.status) }}
              </span>
            </div>
          </div>

          <!-- Validating Laboratorist Info Banner & Signature Name -->
          <div class="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2 text-xs">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base">🔬</span>
                <div>
                  <span class="font-bold text-slate-800 dark:text-slate-100">
                    Laboratorista / Químico Responsable:
                  </span>
                  <span class="ml-1 text-blue-700 dark:text-blue-300 font-semibold">
                    {{ authService.username() }} ({{ authService.userRole() }})
                  </span>
                </div>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">
                Aparecerá como firma oficial en el informe impreso
              </span>
            </div>

            <div class="flex items-center gap-2">
              <label class="text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Firma / Nombre Profesional:
              </label>
              <input
                type="text"
                [(ngModel)]="laboratoristName"
                class="form-control text-xs py-1 font-semibold"
                placeholder="Ej: Lic. Carlos Mendoza - QFB / Reg. LAB-4402" />
            </div>
          </div>

          <!-- Items and Results Matrix -->
          <div class="space-y-4 max-h-[440px] overflow-y-auto pr-1">
            @for (item of order.items; track item.id) {
              <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                <div class="bg-blue-50/80 dark:bg-blue-950/40 px-3.5 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span class="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <span>🧪</span> {{ item.studyName }} ({{ item.studyCode }})
                  </span>
                  <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                    $ {{ item.price | number:'1.2-2' }}
                  </span>
                </div>

                <div class="p-2 overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead>
                      <tr class="text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700">
                        <th class="p-2 w-48">Analito / Parámetro</th>
                        <th class="p-2 w-36">Resultado Capturado</th>
                        <th class="p-2 w-20">Unidad</th>
                        <th class="p-2 w-48">Rango de Referencia</th>
                        <th class="p-2 w-28 text-center">Evaluación</th>
                        <th class="p-2">Interpretación / Notas</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                      @for (res of item.results; track res.id || res.labParameterId) {
                        <tr>
                          <td class="p-2 font-semibold text-slate-800 dark:text-slate-200">
                            {{ res.parameterName }}
                            @if (res.examName) {
                              <span class="block text-[10px] text-slate-400 font-normal">{{ res.examName }}</span>
                            }
                          </td>
                          <td class="p-2">
                            @if (res.valueType === 'Numeric') {
                              <input
                                type="number"
                                [(ngModel)]="res.numericValue"
                                (ngModelChange)="evaluateRange(res)"
                                step="any"
                                class="form-control text-xs font-mono font-bold py-1"
                                placeholder="Valor numérico..." />
                            } @else {
                              <input
                                type="text"
                                [(ngModel)]="res.textValue"
                                class="form-control text-xs py-1"
                                placeholder="Positivo / Negativo / Hallazgo..." />
                            }
                          </td>
                          <td class="p-2 font-mono text-slate-600 dark:text-slate-400">
                            {{ res.unit || '-' }}
                          </td>
                          <td class="p-2 text-slate-600 dark:text-slate-400 text-[11px]">
                            @if (res.referenceText) {
                              <span>{{ res.referenceText }}</span>
                            } @else if (res.referenceRangeMin != null || res.referenceRangeMax != null) {
                              <span class="font-mono">
                                {{ res.referenceRangeMin ?? '0' }} - {{ res.referenceRangeMax ?? 'N/A' }}
                              </span>
                            } @else {
                              <span>-</span>
                            }
                          </td>
                          <td class="p-2 text-center">
                            @if (res.valueType === 'Numeric' && res.numericValue != null) {
                              @if (res.alertLevel === 'High') {
                                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                                  ▲ ALTO
                                </span>
                              } @else if (res.alertLevel === 'Low') {
                                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
                                  ▼ BAJO
                                </span>
                              } @else {
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                                  ✓ NORMAL
                                </span>
                              }
                            } @else if (res.textValue) {
                              <span class="text-[10px] text-slate-500">Registrado</span>
                            } @else {
                              <span class="text-[10px] text-slate-400">—</span>
                            }
                          </td>
                          <td class="p-2">
                            <input
                              type="text"
                              [(ngModel)]="res.interpretation"
                              class="form-control text-xs py-1"
                              placeholder="Observación opcional..." />
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>

          <!-- General Interpretation / Observations -->
          <div class="pt-2">
            <label class="form-label font-bold text-xs">Observaciones Generales / Conclusión del Análisis</label>
            <textarea
              [(ngModel)]="generalNotes"
              class="form-control text-xs"
              rows="2"
              placeholder="Comentarios adicionales, método de confirmación o notas del químico/laboratorista..."></textarea>
          </div>

          <!-- Action Footer -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" class="btn btn-secondary" (click)="close()">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary font-bold"
              [disabled]="saving"
              (click)="saveResults()">
              @if (saving) {
                <span class="spinner-sm mr-1.5"></span>
              }
              ✓ Guardar y Concluir Resultados
            </button>
          </div>
        </div>
      }
    </app-modal>
  `
})
export class StudyCaptureResultsModalComponent implements OnChanges {
  private readonly orderService = inject(StudyOrderService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  @Input() isOpen = false;
  @Input() order: StudyOrderDto | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() resultsSaved = new EventEmitter<StudyOrderDto>();

  saving = false;
  generalNotes = '';
  laboratoristName = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.order) {
      this.generalNotes = this.order.notes || '';
      const user = this.authService.username();
      this.laboratoristName = this.order.laboratoristName || (user ? `Lic. ${user} - Laboratorio Clínico` : 'Responsable de Laboratorio');

      // Evaluate ranges for loaded items
      for (const item of this.order.items || []) {
        for (const res of item.results || []) {
          this.evaluateRange(res);
        }
      }
    }
  }

  evaluateRange(res: StudyOrderResultDto): void {
    if (res.valueType === 'Numeric' && res.numericValue != null) {
      const val = res.numericValue;
      if (res.referenceRangeMax != null && val > res.referenceRangeMax) {
        res.isOutOfRange = true;
        res.alertLevel = 'High';
      } else if (res.referenceRangeMin != null && val < res.referenceRangeMin) {
        res.isOutOfRange = true;
        res.alertLevel = 'Low';
      } else {
        res.isOutOfRange = false;
        res.alertLevel = 'Normal';
      }
    } else {
      res.isOutOfRange = false;
      res.alertLevel = 'Normal';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'Requested': return '⏳ Solicitado';
      case 'SampleCollected': return '🩸 Muestra Tomada';
      case 'InAnalysis': return '🔬 En Análisis';
      case 'Completed': return '✓ Resultados Listos';
      case 'Delivered': return '📦 Entregado';
      case 'Cancelled': return '✕ Cancelado';
      default: return status || '';
    }
  }

  saveResults(): void {
    if (!this.order) return;

    if (!this.authService.isLaboratorist() && !this.authService.isAdmin()) {
      this.toast.error('Solo el personal de Laboratorio o Administradores tienen permisos para capturar o validar resultados de estudios.');
      return;
    }

    this.saving = true;
    const dto: SaveStudyResultsDto = {
      specialistId: this.authService.specialistId(),
      laboratoristId: this.authService.specialistId() || undefined,
      laboratoristName: this.laboratoristName?.trim() || undefined,
      generalInterpretation: this.generalNotes,
      results: []
    };

    for (const item of this.order.items || []) {
      for (const res of item.results || []) {
        dto.results.push({
          studyOrderItemId: item.id,
          labParameterId: res.labParameterId,
          numericValue: res.numericValue != null && res.numericValue !== ('' as any) ? Number(res.numericValue) : null,
          textValue: res.textValue || null,
          interpretation: res.interpretation || null,
          technicianNotes: res.technicianNotes || null
        });
      }
    }

    this.orderService.saveResults(this.order.id, dto).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success && res.data) {
          this.toast.success('Resultados guardados y orden completada exitosamente.');
          this.resultsSaved.emit(res.data);
          this.close();
        } else {
          this.toast.error(res.message || 'Error al guardar resultados.');
        }
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.message || 'Error al guardar resultados del estudio.');
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
