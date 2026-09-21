import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDto, StudyOrderDto, StudyOrderStatus } from '../../../core/models/models';
import { StudyOrderService } from '../../../core/services/study-order.service';
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

        <button type="button" class="btn btn-sm btn-primary" (click)="openCreateModal()">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          + Solicitar Estudio para este Paciente
        </button>
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
          <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">No hay órdenes de estudios clínicos registradas</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Haga clic en "+ Solicitar Estudio para este Paciente" para emitir una orden de laboratorio, rayos X o ecografía.
          </p>
          <button type="button" class="btn btn-sm btn-primary mt-4" (click)="openCreateModal()">
            + Solicitar Primer Estudio
          </button>
        </div>
      } @else {
        <div class="space-y-3">
          @for (order of orders(); track order.id) {
            <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-all hover:border-blue-300 dark:hover:border-blue-700">
              <div class="flex items-start justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                    {{ order.orderNumber }}
                  </span>
                  <span class="text-xs text-slate-500 font-mono">
                    🗓️ {{ order.orderDate | date:'dd/MM/yyyy HH:mm' }}
                  </span>
                  @if (order.specialistName) {
                    <span class="text-xs text-slate-600 dark:text-slate-300">
                      • Solicitó: 👨‍⚕️ {{ order.specialistName }}
                    </span>
                  }
                </div>

                <div class="flex items-center gap-2">
                  <span
                    class="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    [class.bg-amber-100]="order.status === 'Requested'"
                    [class.text-amber-800]="order.status === 'Requested'"
                    [class.bg-blue-100]="order.status === 'InAnalysis'"
                    [class.text-blue-800]="order.status === 'InAnalysis'"
                    [class.bg-emerald-100]="order.status === 'Completed' || order.status === 'Delivered'"
                    [class.text-emerald-800]="order.status === 'Completed' || order.status === 'Delivered'">
                    {{ getStatusLabel(order.status) }}
                  </span>
                  <span class="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    $ {{ order.totalAmount | number:'1.2-2' }}
                  </span>
                </div>
              </div>

              <!-- Studies and Results Summary -->
              <div class="py-2.5 space-y-2">
                @for (item of order.items; track item.id) {
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                    <div class="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      <span>🧪 {{ item.studyName }} ({{ item.studyCode }})</span>
                      <span class="text-[10px] text-slate-400 font-normal uppercase">{{ item.studyCategoryName }}</span>
                    </div>

                    <!-- Parameter results chips -->
                    <div class="flex flex-wrap gap-1.5 mt-1.5">
                      @for (res of item.results; track res.id) {
                        <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border text-[11px]"
                          [class.border-rose-300]="res.isOutOfRange"
                          [class.bg-rose-50]="res.isOutOfRange"
                          [class.dark:bg-rose-950/30]="res.isOutOfRange"
                          [class.border-slate-200]="!res.isOutOfRange"
                          [class.dark:border-slate-700]="!res.isOutOfRange">
                          <span class="text-slate-500 font-medium">{{ res.parameterName }}:</span>
                          <span class="font-bold font-mono" [class.text-rose-600]="res.isOutOfRange">
                            {{ res.numericValue != null ? res.numericValue : (res.textValue || 'Pendiente') }} {{ res.unit || '' }}
                          </span>
                          @if (res.alertLevel === 'High') {
                            <span class="text-[9px] font-extrabold text-rose-600">▲</span>
                          } @else if (res.alertLevel === 'Low') {
                            <span class="text-[9px] font-extrabold text-blue-600">▼</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Actions Bottom Bar -->
              <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  class="btn btn-xs btn-outline-primary"
                  title="Capturar o editar resultados"
                  (click)="openResultsModal(order)">
                  📝 Capturar Resultados
                </button>

                @if (order.status === 'Completed' || order.status === 'Delivered') {
                  <button
                    type="button"
                    class="btn btn-xs btn-primary font-bold"
                    (click)="openReportModal(order)">
                    📄 Ver e Imprimir Informe
                  </button>
                }
              </div>
            </div>
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

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  openResultsModal(order: StudyOrderDto): void {
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
}
