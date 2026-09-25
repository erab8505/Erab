import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDto, StudyOrderDto, StudyOrderItemDto, StudyOrderResultDto, StudyOrderStatus } from '../../../core/models/models';
import { StudyOrderService } from '../../../core/services/study-order.service';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateStudyOrderModalComponent } from '../../studies/components/create-study-order-modal.component';
import { StudyCaptureResultsModalComponent } from '../../studies/components/study-capture-results-modal.component';
import { StudyReportModalComponent } from '../../studies/components/study-report-modal.component';

@Component({
  selector: 'app-patient-studies-tab',
  standalone: true,
  imports: [
    CommonModule,
    CreateStudyOrderModalComponent,
    StudyCaptureResultsModalComponent,
    StudyReportModalComponent
  ],
  template: `
    <div class="space-y-4">
      <!-- Top Action Bar -->
      <div class="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>🔬</span> Historial de Estudios Clínicos y Análisis de Laboratorio
          </h3>
          <p class="text-xs text-slate-500">Órdenes solicitadas, valores analíticos, alertas y reportes oficiales del paciente</p>
        </div>

        @if (canCreateOrder()) {
          <button type="button" class="btn btn-sm btn-primary" (click)="openCreateModal()">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            + Solicitar Estudio para este Paciente
          </button>
        }
      </div>

      <!-- Orders List / Cards -->
      @if (loading()) {
        <div class="p-8 text-center text-slate-500">
          <span class="spinner-sm mb-2 block mx-auto"></span>
          <span class="text-xs">Consultando estudios del paciente...</span>
        </div>
      } @else if (orders().length === 0) {
        <div class="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/30">
          <span class="text-4xl block mb-2">🧪</span>
          <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">No hay estudios clínicos registrados</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            No se han emitido órdenes de laboratorio o estudios para este paciente.
          </p>
          @if (canCreateOrder()) {
            <button type="button" class="btn btn-sm btn-primary mt-4" (click)="openCreateModal()">
              + Solicitar Primer Estudio
            </button>
          }
        </div>
      } @else {
        <div class="space-y-3">
          @for (order of orders(); track order.id) {
            @for (item of order.items; track item.id) {
              <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 transition-all hover:border-blue-300 dark:hover:border-blue-700">
                <!-- Nombre del Estudio & Botón Ver e Imprimir Informe -->
                <div class="flex items-center justify-between flex-wrap gap-3">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      🧪 {{ item.studyName }}
                    </span>
                    <span class="text-xs text-slate-400 font-mono">
                      ({{ order.orderDate | date:'dd/MM/yyyy HH:mm' }})
                    </span>
                  </div>

                  <!-- Botón Ver e Imprimir Informe (Solo estudios completados) -->
                  @if (isCompleted(order, item)) {
                    <button
                      type="button"
                      class="btn btn-sm btn-primary font-bold flex items-center gap-1.5"
                      (click)="openReportModal(order)">
                      <span>📄</span> Ver e Imprimir Informe
                    </button>
                  }
                </div>

                <!-- Valores Fuera de Rango -->
                <div class="pt-1">
                  @if (getOutOfRangeResults(item).length > 0) {
                    <div class="space-y-1.5">
                      <span class="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1">
                        ⚠️ Valores Fuera de Rango:
                      </span>
                      <div class="flex flex-wrap gap-2">
                        @for (res of getOutOfRangeResults(item); track res.id) {
                          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-xs">
                            <span class="text-slate-700 dark:text-slate-200 font-semibold">{{ res.parameterName }}:</span>
                            <span class="font-mono font-extrabold text-rose-600 dark:text-rose-400">
                              {{ res.numericValue != null ? res.numericValue : res.textValue }} {{ res.unit || '' }}
                            </span>
                            @if (res.referenceText) {
                              <span class="text-[10px] text-slate-500 font-normal">({{ res.referenceText }})</span>
                            } @else if (res.referenceRangeMin != null && res.referenceRangeMax != null) {
                              <span class="text-[10px] text-slate-500 font-normal">(Ref: {{ res.referenceRangeMin }} - {{ res.referenceRangeMax }})</span>
                            }
                            @if (res.alertLevel === 'High') {
                              <span class="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded">▲ Alto</span>
                            } @else if (res.alertLevel === 'Low') {
                              <span class="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">▼ Bajo</span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  } @else if (hasResults(item)) {
                    <span class="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <span>✓</span> Todos los valores dentro del rango normal
                    </span>
                  } @else {
                    <span class="text-xs text-slate-400 italic">
                      Resultados en proceso de laboratorio
                    </span>
                  }
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- Modals -->
      <app-create-study-order-modal
        [isOpen]="createModalOpen()"
        [preselectedPatient]="patient"
        (closed)="createModalOpen.set(false)"
        (orderCreated)="onOrderCreated($event)">
      </app-create-study-order-modal>

      <app-study-capture-results-modal
        [isOpen]="resultsModalOpen()"
        [order]="selectedOrder()"
        (closed)="resultsModalOpen.set(false)"
        (resultsSaved)="onResultsSaved($event)">
      </app-study-capture-results-modal>

      <app-study-report-modal
        [isOpen]="reportModalOpen()"
        [order]="selectedOrder()"
        [companyName]="companyContext.activeCompanyName()"
        [companyTaxId]="companyContext.activeCompany()?.taxId || ''"
        [companyPhone]="companyContext.activeCompany()?.phone || ''"
        [companyAddress]="companyContext.activeCompany()?.address || ''"
        (closed)="reportModalOpen.set(false)">
      </app-study-report-modal>
    </div>
  `
})
export class PatientStudiesTabComponent implements OnInit, OnChanges {
  private readonly orderService = inject(StudyOrderService);
  readonly authService = inject(AuthService);
  readonly companyContext = inject(CompanyContextService);
  private readonly toast = inject(ToastService);

  @Input() patient: PatientDto | null = null;

  readonly orders = signal<StudyOrderDto[]>([]);
  readonly loading = signal<boolean>(true);

  // Modals
  readonly createModalOpen = signal<boolean>(false);
  readonly resultsModalOpen = signal<boolean>(false);
  readonly reportModalOpen = signal<boolean>(false);
  readonly selectedOrder = signal<StudyOrderDto | null>(null);

  ngOnInit(): void {
    if (this.patient) {
      this.loadPatientOrders();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patient'] && this.patient) {
      this.loadPatientOrders();
    }
  }

  loadPatientOrders(): void {
    if (!this.patient) return;
    this.loading.set(true);
    this.orderService.getAll(undefined, this.patient.id).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.orders.set(res.data || []);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar estudios del paciente.');
      }
    });
  }

  getStatusLabel(status?: StudyOrderStatus): string {
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

  canCreateOrder(): boolean {
    if (!this.companyContext.hasLaboratory()) return false;
    if (this.authService.canManageStudyOrders()) return true;
    if (this.authService.isReceptionist() && this.companyContext.canReceptionistCreateStudies()) return true;
    return false;
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  openResultsModal(order: StudyOrderDto): void {
    if (!this.authService.isLaboratorist() && !this.authService.isAdmin()) {
      this.toast.error('Solo el personal de Laboratorio o Administradores pueden capturar y validar resultados de estudios.');
      return;
    }
    this.selectedOrder.set(order);
    this.resultsModalOpen.set(true);
  }

  openReportModal(order: StudyOrderDto): void {
    this.selectedOrder.set(order);
    this.reportModalOpen.set(true);
  }

  onOrderCreated(_order: StudyOrderDto): void {
    this.loadPatientOrders();
  }

  onResultsSaved(_order: StudyOrderDto): void {
    this.loadPatientOrders();
  }

  getOutOfRangeResults(item: StudyOrderItemDto): StudyOrderResultDto[] {
    return (item.results || []).filter(r => r.isOutOfRange);
  }

  hasResults(item: StudyOrderItemDto): boolean {
    return !!(item.results && item.results.length > 0 && item.results.some(r => r.numericValue != null || r.textValue));
  }

  isCompleted(order: StudyOrderDto, item?: StudyOrderItemDto): boolean {
    if (item && (item.status === 'Completed' || item.status === 'Delivered')) {
      return true;
    }
    return order.status === 'Completed' || order.status === 'Delivered';
  }
}
