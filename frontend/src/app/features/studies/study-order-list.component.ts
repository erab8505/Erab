import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudyOrderDto, StudyOrderStatus } from '../../core/models/models';
import { StudyOrderService } from '../../core/services/study-order.service';
import { AuthService } from '../../core/services/auth.service';
import { CompanyContextService } from '../../core/services/company-context.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { CreateStudyOrderModalComponent } from './components/create-study-order-modal.component';
import { StudyCaptureResultsModalComponent } from './components/study-capture-results-modal.component';
import { StudyReportModalComponent } from './components/study-report-modal.component';

@Component({
  selector: 'app-study-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DataTableComponent,
    CreateStudyOrderModalComponent,
    StudyCaptureResultsModalComponent,
    StudyReportModalComponent
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>🔬</span> Bandeja de Estudios Clínicos y Laboratorio
          </h1>
          <p class="text-slate-500 text-sm">Control de órdenes de análisis, toma de muestras, captura de resultados y emisión de informes</p>
        </div>

        <div class="flex items-center gap-2.5">
          @if (authService.isAdmin()) {
            <a routerLink="/studies/catalog" class="btn btn-outline-primary text-xs font-bold">
              ⚙️ Catálogo de Estudios
            </a>
          }
          <button type="button" class="btn btn-primary" (click)="openCreateModal()">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            + Nueva Orden de Estudio
          </button>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Órdenes</span>
          <span class="text-xl font-extrabold text-slate-800 dark:text-slate-100">{{ orders().length }}</span>
        </div>

        <div class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl shadow-xs">
          <span class="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Pendientes / Muestra</span>
          <span class="text-xl font-extrabold text-amber-700 dark:text-amber-300">{{ pendingCount() }}</span>
        </div>

        <div class="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl shadow-xs">
          <span class="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">En Análisis</span>
          <span class="text-xl font-extrabold text-blue-700 dark:text-blue-300">{{ inAnalysisCount() }}</span>
        </div>

        <div class="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl shadow-xs">
          <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Resultados Listos</span>
          <span class="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">{{ completedCount() }}</span>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center justify-between flex-wrap gap-3">
        <!-- Status Pills -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            [class.bg-blue-600]="selectedStatus() === null"
            [class.text-white]="selectedStatus() === null"
            [class.bg-slate-100]="selectedStatus() !== null"
            [class.dark:bg-slate-800]="selectedStatus() !== null"
            [class.text-slate-600]="selectedStatus() !== null"
            (click)="selectedStatus.set(null)">
            Todos ({{ orders().length }})
          </button>

          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            [class.bg-amber-500]="selectedStatus() === 'Requested'"
            [class.text-white]="selectedStatus() === 'Requested'"
            [class.bg-slate-100]="selectedStatus() !== 'Requested'"
            [class.dark:bg-slate-800]="selectedStatus() !== 'Requested'"
            [class.text-slate-600]="selectedStatus() !== 'Requested'"
            (click)="selectedStatus.set('Requested')">
            ⏳ Solicitados
          </button>

          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            [class.bg-blue-600]="selectedStatus() === 'InAnalysis'"
            [class.text-white]="selectedStatus() === 'InAnalysis'"
            [class.bg-slate-100]="selectedStatus() !== 'InAnalysis'"
            [class.dark:bg-slate-800]="selectedStatus() !== 'InAnalysis'"
            [class.text-slate-600]="selectedStatus() !== 'InAnalysis'"
            (click)="selectedStatus.set('InAnalysis')">
            🔬 En Análisis
          </button>

          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            [class.bg-emerald-600]="selectedStatus() === 'Completed'"
            [class.text-white]="selectedStatus() === 'Completed'"
            [class.bg-slate-100]="selectedStatus() !== 'Completed'"
            [class.dark:bg-slate-800]="selectedStatus() !== 'Completed'"
            [class.text-slate-600]="selectedStatus() !== 'Completed'"
            (click)="selectedStatus.set('Completed')">
            ✓ Listos
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full sm:w-64">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            class="form-control text-xs pl-8"
            placeholder="Buscar por orden o paciente..." />
          <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      <!-- Data Table -->
      <app-data-table
        [columns]="columns"
        [data]="filteredOrders()"
        [loading]="loading()">

        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('orderNumber') {
              <div>
                <span class="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded border border-slate-200 dark:border-slate-700">
                  {{ item.orderNumber }}
                </span>
                <span class="block text-[10px] text-slate-400 mt-0.5">
                  {{ item.orderDate | date:'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
            }
            @case ('patientName') {
              <div>
                <span class="font-bold text-xs text-slate-800 dark:text-slate-100">
                  {{ item.patientName }}
                </span>
                @if (item.patientDocumentId) {
                  <span class="block text-[10px] text-slate-400 font-mono">
                    Doc: {{ item.patientDocumentId }}
                  </span>
                }
              </div>
            }
            @case ('studies') {
              <div class="space-y-0.5">
                @for (study of item.items; track study.id) {
                  <div class="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>🧪</span>
                    <span class="font-medium truncate max-w-[200px]">{{ study.studyName }}</span>
                  </div>
                }
              </div>
            }
            @case ('status') {
              <span
                class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                [class.bg-amber-100]="item.status === 'Requested'"
                [class.text-amber-800]="item.status === 'Requested'"
                [class.dark:bg-amber-900/40]="item.status === 'Requested'"
                [class.dark:text-amber-300]="item.status === 'Requested'"
                [class.bg-purple-100]="item.status === 'SampleCollected'"
                [class.text-purple-800]="item.status === 'SampleCollected'"
                [class.bg-blue-100]="item.status === 'InAnalysis'"
                [class.text-blue-800]="item.status === 'InAnalysis'"
                [class.dark:bg-blue-900/40]="item.status === 'InAnalysis'"
                [class.dark:text-blue-300]="item.status === 'InAnalysis'"
                [class.bg-emerald-100]="item.status === 'Completed' || item.status === 'Delivered'"
                [class.text-emerald-800]="item.status === 'Completed' || item.status === 'Delivered'"
                [class.dark:bg-emerald-900/40]="item.status === 'Completed' || item.status === 'Delivered'"
                [class.dark:text-emerald-300]="item.status === 'Completed' || item.status === 'Delivered'">
                {{ getStatusLabel(item.status) }}
              </span>
            }
            @case ('totalAmount') {
              <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                $ {{ item.totalAmount | number:'1.2-2' }}
              </span>
            }
            @default {
              {{ item[col.key] || '-' }}
            }
          }
        </ng-template>

        <ng-template #actionTemplate let-item>
          <div class="table-actions">
            <!-- Stage transition button -->
            @if (item.status === 'Requested') {
              <button
                type="button"
                class="table-action-btn font-semibold text-purple-600"
                title="Marcar muestra tomada"
                (click)="changeStatus(item, 'SampleCollected')">
                🩸 Muestra Tomada
              </button>
            } @else if (item.status === 'SampleCollected') {
              <button
                type="button"
                class="table-action-btn font-semibold text-blue-600"
                title="Pasar a análisis"
                (click)="changeStatus(item, 'InAnalysis')">
                🔬 Iniciar Análisis
              </button>
            }

            <!-- Capture Results Button (Only for Laboratorists / Admins) -->
            @if (authService.isLaboratorist() || authService.isAdmin()) {
              <button
                type="button"
                class="table-action-btn font-bold text-blue-600 dark:text-blue-400"
                title="Capturar Resultados"
                (click)="openResultsModal(item)">
                📝 Resultados
              </button>
            }

            <!-- Report Button (if completed) -->
            @if (item.status === 'Completed' || item.status === 'Delivered') {
              <button
                type="button"
                class="table-action-btn font-bold text-emerald-600 dark:text-emerald-400"
                title="Ver e Imprimir Informe"
                (click)="openReportModal(item)">
                📄 Informe
              </button>
            }

            <!-- Cancel Button -->
            @if (item.status !== 'Completed' && item.status !== 'Delivered' && item.status !== 'Cancelled') {
              <button
                type="button"
                class="table-action-btn text-slate-400 hover:text-rose-600"
                title="Cancelar Orden"
                (click)="cancelOrder(item)">
                ✕
              </button>
            }
          </div>
        </ng-template>
      </app-data-table>

      <!-- Modal 1: Crear Orden -->
      <app-create-study-order-modal
        [isOpen]="createModalOpen()"
        (closed)="createModalOpen.set(false)"
        (orderCreated)="onOrderCreated($event)">
      </app-create-study-order-modal>

      <!-- Modal 2: Captura de Resultados -->
      <app-study-capture-results-modal
        [isOpen]="resultsModalOpen()"
        [order]="selectedOrder()"
        (closed)="resultsModalOpen.set(false)"
        (resultsSaved)="onResultsSaved($event)">
      </app-study-capture-results-modal>

      <!-- Modal 3: Informe Oficial Membretado -->
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
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .table-actions { display: flex; align-items: center; gap: 0.35rem; justify-content: flex-end; flex-wrap: wrap; }
    .table-action-btn {
      background: none;
      border: 1px solid transparent;
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0.2rem 0.45rem;
      border-radius: 0.375rem;
      transition: all 0.15s;
    }
    .table-action-btn:hover { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); }
    :host-context(.dark) .table-action-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
  `]
})
export class StudyOrderListComponent implements OnInit {
  private readonly orderService = inject(StudyOrderService);
  readonly authService = inject(AuthService);
  readonly companyContext = inject(CompanyContextService);
  private readonly toast = inject(ToastService);

  readonly orders = signal<StudyOrderDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly selectedStatus = signal<StudyOrderStatus | null>(null);
  searchQuery = '';

  // Modals
  readonly createModalOpen = signal<boolean>(false);
  readonly resultsModalOpen = signal<boolean>(false);
  readonly reportModalOpen = signal<boolean>(false);
  readonly selectedOrder = signal<StudyOrderDto | null>(null);

  readonly columns: TableColumn<StudyOrderDto>[] = [
    { key: 'orderNumber', label: 'Orden / Fecha', sortable: true, width: '150px' },
    { key: 'patientName', label: 'Paciente', sortable: true },
    { key: 'studies', label: 'Estudios Solicitados', sortable: false },
    { key: 'totalAmount', label: 'Total', sortable: true, width: '100px' },
    { key: 'status', label: 'Estado', sortable: true, width: '140px' }
  ];

  readonly pendingCount = computed(() => this.orders().filter(o => o.status === 'Requested' || o.status === 'SampleCollected').length);
  readonly inAnalysisCount = computed(() => this.orders().filter(o => o.status === 'InAnalysis').length);
  readonly completedCount = computed(() => this.orders().filter(o => o.status === 'Completed' || o.status === 'Delivered').length);

  readonly filteredOrders = computed(() => {
    let list = this.orders();
    const st = this.selectedStatus();
    if (st) {
      list = list.filter(o => o.status === st);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.patientName.toLowerCase().includes(q) ||
        (o.patientDocumentId && o.patientDocumentId.toLowerCase().includes(q))
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getAll().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.orders.set(res.data || []);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar órdenes de laboratorio.');
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

  changeStatus(order: StudyOrderDto, newStatus: StudyOrderStatus): void {
    this.orderService.updateStatus(order.id, { status: newStatus }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.toast.success(`Estado actualizado a ${this.getStatusLabel(newStatus)}.`);
          this.loadOrders();
        }
      },
      error: () => this.toast.error('Error al actualizar estado de la orden.')
    });
  }

  cancelOrder(order: StudyOrderDto): void {
    if (!confirm(`¿Está seguro de que desea cancelar la orden ${order.orderNumber}?`)) return;

    this.orderService.cancel(order.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.warning('Orden cancelada.');
          this.loadOrders();
        }
      },
      error: () => this.toast.error('Error al cancelar orden.')
    });
  }

  onOrderCreated(_order: StudyOrderDto): void {
    this.loadOrders();
  }

  onResultsSaved(_order: StudyOrderDto): void {
    this.loadOrders();
  }
}
