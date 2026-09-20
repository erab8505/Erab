import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AppointmentStatus, SchedulingDto, SpecialistDto, TimeSlotDto } from '../../core/models/models';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

@Component({
  selector: 'app-scheduling-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, ModalComponent, ConfirmDialogComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Agenda Médica y Citas</h1>
          <p class="text-slate-500 text-sm">Control de turnos, confirmaciones y reprogramación de citas</p>
        </div>
        <a routerLink="/scheduling/new" class="btn btn-primary">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Cita (Asistente)
        </a>
      </div>

      <app-data-table 
        [data]="schedulings()" 
        [columns]="columns" 
        [loading]="loading()"
        placeholder="Buscar por paciente, documento, especialista...">
        
        <ng-template #cellTemplate let-item let-col="column">
          @switch (col.key) {
            @case ('scheduledAt') {
              <span class="font-semibold text-slate-900 dark:text-slate-100">
                🗓️ {{ item.scheduledAt | date:'dd/MM/yyyy HH:mm' }}
              </span>
            }
            @case ('patientName') {
              <div>
                <a [routerLink]="['/patients', item.patientId]" class="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  {{ item.patientName }}
                </a>
                <span class="text-xs text-slate-400 block">Doc: {{ item.patientDocument }}</span>
              </div>
            }
            @case ('specialistName') {
              <span>👨‍⚕️ {{ item.specialistName }}</span>
            }
            @case ('status') {
              <app-badge [variant]="getStatusVariant(item.status)" [text]="item.status"></app-badge>
            }
            @default {
              {{ item[col.key] || '-' }}
            }
          }
        </ng-template>

        <ng-template #actionTemplate let-item>
          <div class="flex items-center justify-end gap-1.5">
            @if (item.status === 'Scheduled') {
              <button type="button" class="btn btn-secondary btn-sm text-blue-600" title="Confirmar Cita" (click)="updateStatus(item, 'Confirmed')">
                ✓ Confirmar
              </button>
            }
            @if (item.status === 'Confirmed' || item.status === 'Scheduled') {
              <button type="button" class="btn btn-secondary btn-sm text-emerald-600" title="Marcar Atendida" (click)="updateStatus(item, 'Completed')">
                ✓ Atendida
              </button>
              <button type="button" class="btn btn-secondary btn-sm text-amber-600" title="Reprogramar" (click)="openRescheduleModal(item)">
                🔄 Reagendar
              </button>
              <button type="button" class="btn btn-secondary btn-sm text-rose-600" title="Cancelar Cita" (click)="confirmCancel(item)">
                ✕ Cancelar
              </button>
            }
          </div>
        </ng-template>
      </app-data-table>

      <!-- MODAL REPROGRAMACIÓN -->
      <app-modal 
        [isOpen]="rescheduleModalOpen()" 
        title="Reprogramar Cita Médica" 
        size="lg"
        (closed)="closeRescheduleModal()">
        
        @if (selectedAppointment(); as app) {
          <div class="space-y-4">
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded border text-xs">
              <span class="block"><b>Paciente:</b> {{ app.patientName }} (Doc: {{ app.patientDocument }})</span>
              <span class="block"><b>Especialista:</b> {{ app.specialistName }} | <b>Procedimiento:</b> {{ app.interventionName }}</span>
              <span class="block"><b>Horario Anterior:</b> {{ app.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>

            <div>
              <label class="form-label">Nueva Fecha *</label>
              <input 
                type="date" 
                [(ngModel)]="newDate" 
                (ngModelChange)="loadNewSlots()"
                [min]="todayStr"
                class="form-control" />
            </div>

            <div>
              <label class="form-label">Seleccione Nuevo Turno *</label>
              @if (loadingNewSlots()) {
                <span class="text-xs text-slate-500">Cargando turnos disponibles...</span>
              } @else if (newSlots().length === 0) {
                <span class="text-xs text-slate-400 italic block">No hay turnos disponibles para esta fecha.</span>
              } @else {
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  @for (slot of newSlots(); track slot.startTime) {
                    <button 
                      type="button" 
                      [disabled]="!slot.isAvailable"
                      class="p-2 rounded text-xs border font-semibold"
                      [class.bg-blue-600]="selectedNewSlot()?.startTime === slot.startTime"
                      [class.text-white]="selectedNewSlot()?.startTime === slot.startTime"
                      (click)="selectedNewSlot.set(slot)">
                      {{ formatSlotTime(slot.startTime) }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        }

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeRescheduleModal()">Cancelar</button>
          <button 
            type="button" 
            class="btn btn-primary" 
            [disabled]="!selectedNewSlot() || savingReschedule()" 
            (click)="saveReschedule()">
            @if (savingReschedule()) {
              <span class="spinner-sm mr-1.5"></span>
            }
            Reprogramar Cita
          </button>
        </div>
      </app-modal>

      <!-- CONFIRM CANCEL DIALOG -->
      <app-confirm-dialog 
        [isOpen]="cancelDialogOpen()" 
        title="Cancelar Cita Médica"
        message="¿Está seguro de que desea cancelar esta cita? El horario quedará liberado para otros pacientes."
        confirmText="Sí, Cancelar Cita"
        variant="danger"
        [loading]="cancelling()"
        (confirmed)="cancelAppointment()"
        (cancelled)="cancelDialogOpen.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
  `]
})
export class SchedulingListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly schedulings = signal<SchedulingDto[]>([]);
  readonly loading = signal<boolean>(true);

  readonly rescheduleModalOpen = signal<boolean>(false);
  readonly selectedAppointment = signal<SchedulingDto | null>(null);
  readonly newSlots = signal<TimeSlotDto[]>([]);
  readonly selectedNewSlot = signal<TimeSlotDto | null>(null);
  readonly loadingNewSlots = signal<boolean>(false);
  readonly savingReschedule = signal<boolean>(false);

  readonly cancelDialogOpen = signal<boolean>(false);
  readonly appointmentToCancel = signal<SchedulingDto | null>(null);
  readonly cancelling = signal<boolean>(false);

  newDate: string = new Date().toISOString().substring(0, 10);

  get todayStr(): string {
    return new Date().toISOString().substring(0, 10);
  }

  readonly columns: TableColumn<SchedulingDto>[] = [
    { key: 'scheduledAt', label: 'Fecha y Hora', sortable: true, width: '160px' },
    { key: 'patientName', label: 'Paciente', sortable: true },
    { key: 'specialistName', label: 'Especialista', sortable: true },
    { key: 'interventionName', label: 'Procedimiento' },
    { key: 'durationMinutes', label: 'Duración', width: '90px' },
    { key: 'status', label: 'Estado', sortable: true, width: '120px' }
  ];

  ngOnInit(): void {
    this.loadSchedulings();
  }

  loadSchedulings(): void {
    this.loading.set(true);
    this.http.get<ApiResponse<SchedulingDto[]>>(`${environment.apiUrl}/scheduling`).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.schedulings.set(res.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  getStatusVariant(status: string): 'primary' | 'success' | 'danger' | 'warning' | 'info' {
    switch (status) {
      case 'Completed': return 'success';
      case 'Confirmed': return 'primary';
      case 'Cancelled': return 'danger';
      case 'Rescheduled': return 'warning';
      default: return 'info';
    }
  }

  updateStatus(item: SchedulingDto, newStatus: AppointmentStatus): void {
    this.http.patch<ApiResponse>(`${environment.apiUrl}/scheduling/${item.id}/status`, { status: newStatus }).subscribe({
      next: () => {
        this.toast.success(`Cita actualizada a: ${newStatus}`);
        this.loadSchedulings();
      }
    });
  }

  openRescheduleModal(item: SchedulingDto): void {
    this.selectedAppointment.set(item);
    this.selectedNewSlot.set(null);
    this.newDate = new Date().toISOString().substring(0, 10);
    this.rescheduleModalOpen.set(true);
    this.loadNewSlots();
  }

  closeRescheduleModal(): void {
    this.rescheduleModalOpen.set(false);
    this.selectedAppointment.set(null);
  }

  loadNewSlots(): void {
    const app = this.selectedAppointment();
    if (!app || !this.newDate) return;

    this.loadingNewSlots.set(true);
    this.http.get<ApiResponse<TimeSlotDto[]>>(`${environment.apiUrl}/specialists/${app.specialistId}/slots?date=${this.newDate}`).subscribe({
      next: (res) => {
        this.loadingNewSlots.set(false);
        this.newSlots.set(res.data || []);
      },
      error: () => this.loadingNewSlots.set(false)
    });
  }

  formatSlotTime(isoString: string): string {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  saveReschedule(): void {
    const app = this.selectedAppointment();
    const slot = this.selectedNewSlot();
    if (!app || !slot) return;

    this.savingReschedule.set(true);
    this.http.put<ApiResponse>(`${environment.apiUrl}/scheduling/${app.id}/reschedule`, { newScheduledAt: slot.startTime }).subscribe({
      next: () => {
        this.savingReschedule.set(false);
        this.toast.success('Cita reprogramada exitosamente.');
        this.closeRescheduleModal();
        this.loadSchedulings();
      },
      error: () => this.savingReschedule.set(false)
    });
  }

  confirmCancel(item: SchedulingDto): void {
    this.appointmentToCancel.set(item);
    this.cancelDialogOpen.set(true);
  }

  cancelAppointment(): void {
    const app = this.appointmentToCancel();
    if (!app) return;

    this.cancelling.set(true);
    this.http.patch<ApiResponse>(`${environment.apiUrl}/scheduling/${app.id}/status`, { status: 'Cancelled' }).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.cancelDialogOpen.set(false);
        this.toast.warning('Cita cancelada.');
        this.loadSchedulings();
      },
      error: () => this.cancelling.set(false)
    });
  }
}
