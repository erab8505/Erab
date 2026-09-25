import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AppointmentStatus, CreateMedicalRecordDto, CreatePrescriptionDto, CreatePrescriptionItemDto, MedicalRecordDto, PaymentDto, PrescriptionDto, SchedulingDto, SpecialistDto, TimeSlotDto } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { CompanyContextService } from '../../core/services/company-context.service';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { TimegridCalendarComponent } from './components/timegrid-calendar.component';
import { PaymentModalComponent } from './components/payment-modal.component';
import { PaymentReceiptModalComponent } from './components/payment-receipt-modal.component';

@Component({
  selector: 'app-scheduling-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    BadgeComponent,
    TimegridCalendarComponent,
    PaymentModalComponent,
    PaymentReceiptModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold">Agenda Médica y Citas</h1>
          <p class="text-slate-500 text-sm">Control de turnos, atención clínica, confirmaciones, cobros y calendario</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <!-- View Mode Toggle (List vs Calendar) -->
          <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1"
              [class.bg-white]="activeView() === 'list'"
              [class.text-blue-600]="activeView() === 'list'"
              [class.shadow-sm]="activeView() === 'list'"
              [class.dark:bg-slate-700]="activeView() === 'list'"
              [class.text-slate-600]="activeView() !== 'list'"
              [class.dark:text-slate-400]="activeView() !== 'list'"
              (click)="activeView.set('list')">
              📋 Lista
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1"
              [class.bg-white]="activeView() === 'calendar'"
              [class.text-blue-600]="activeView() === 'calendar'"
              [class.shadow-sm]="activeView() === 'calendar'"
              [class.dark:bg-slate-700]="activeView() === 'calendar'"
              [class.text-slate-600]="activeView() !== 'calendar'"
              [class.dark:text-slate-400]="activeView() !== 'calendar'"
              (click)="activeView.set('calendar')">
              📅 Calendario (Cuadrícula)
            </button>
          </div>

          <a routerLink="/scheduling/new" class="btn btn-primary">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nueva Cita (Asistente)
          </a>
        </div>
      </div>

      @if (activeView() === 'calendar') {
        <app-timegrid-calendar
          [appointments]="filteredSchedulings()"
          [specialists]="specialists()"
          (appointmentSelected)="onCalendarAppointmentSelected($event)"
          (emptySlotClicked)="onCalendarEmptySlotClicked($event)">
        </app-timegrid-calendar>
      } @else {
        <!-- Quick Filter Bar -->
        <div class="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtro de Citas:</span>
            
            @if (authService.isOnlySpecialist()) {
              <span class="btn btn-sm btn-primary cursor-default">
                👨‍⚕️ Mis Citas
              </span>
            } @else {
              <button 
                type="button" 
                class="btn btn-sm" 
                [class.btn-primary]="filterMode() === 'ALL'"
                [class.btn-secondary]="filterMode() !== 'ALL'"
                (click)="setFilterMode('ALL')">
                🌐 Todas las Citas
              </button>
              @if (authService.isSpecialist()) {
                <button 
                  type="button" 
                  class="btn btn-sm" 
                  [class.btn-primary]="filterMode() === 'MINE'"
                  [class.btn-secondary]="filterMode() !== 'MINE'"
                  (click)="setFilterMode('MINE')">
                  👨‍⚕️ Mis Citas
                </button>
              }
            }
          </div>

          @if (!authService.isOnlySpecialist()) {
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-500 font-medium">Especialista:</label>
              <select 
                [ngModel]="selectedSpecialistId()" 
                (ngModelChange)="onSpecialistDropdownChange($event)"
                class="form-select text-xs py-1 px-2.5 rounded-lg border-slate-300">
                <option value="">Todos los especialistas</option>
                @for (s of specialists(); track s.id) {
                  <option [value]="s.id">{{ s.fullName }} ({{ s.specialtyName }})</option>
                }
              </select>
            </div>
          }
        </div>

        <app-data-table 
          [data]="filteredSchedulings()" 
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
                  <span class="text-xs text-slate-400 block">Doc: {{ item.patientDocument || item.patientDocumentId || '-' }}</span>
                </div>
              }
              @case ('specialistName') {
                <span class="font-medium">👨‍⚕️ {{ item.specialistName }}</span>
              }
              @case ('status') {
                <app-badge [variant]="getStatusVariant(item.status)" [text]="item.status"></app-badge>
              }
              @case ('payment') {
                @if (item.paymentStatus === 'Paid') {
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:opacity-80 transition-opacity cursor-pointer border border-emerald-300 dark:border-emerald-700"
                    title="Clic para ver recibo de pago"
                    (click)="openReceiptModal(item, $event)">
                    <span>💵 Pagado</span>
                    @if (item.paymentAmount) {
                      <span>(\${{ item.paymentAmount | number:'1.2-2' }})</span>
                    }
                  </button>
                } @else if (item.status === 'Completed') {
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200 transition-colors cursor-pointer border border-amber-300 dark:border-amber-700"
                    title="Clic para registrar cobro"
                    (click)="openPaymentModal(item, $event)">
                    <span> Pendiente</span>
                    <span class="text-[10px] font-semibold underline ml-0.5">Cobrar</span>
                  </button>
                } @else {
                  <span class="text-xs text-slate-400 dark:text-slate-500">—</span>
                }
              }
              @default {
                {{ item[col.key] || '-' }}
              }
            }
          </ng-template>

          <ng-template #actionTemplate let-item>
            <div class="table-actions">
              @if (item.paymentStatus === 'Paid') {
                <button type="button" class="table-action-btn" title="Ver Recibo de Pago" (click)="openReceiptModal(item, $event)">
                  <span>🧾</span> Recibo
                </button>
              } @else if (item.status === 'Completed') {
                <button type="button" class="table-action-btn text-amber-600 font-bold" title="Registrar Cobro" (click)="openPaymentModal(item, $event)">
                  <span>💵</span> Cobrar
                </button>
              }

              @if (item.status === 'Scheduled' || item.status === 0 || item.status === '0') {
                <button type="button" class="table-action-btn btn-confirm" title="Confirmar Cita" (click)="updateStatus(item, 'Confirmed')">
                  <span>✓</span> Confirmar
                </button>
              }
              @if (item.status === 'Confirmed' || item.status === 'Scheduled' || item.status === 0 || item.status === 1 || item.status === '0' || item.status === '1') {
                <!-- Atender Cita con Registro Clínico Completo (Solo roles clínicos) -->
                @if (authService.isAdmin() || authService.isSpecialist()) {
                  <button type="button" class="table-action-btn btn-attend" title="Atender Consulta Médica" (click)="openAttendModal(item)">
                    <span>🩺</span> Atender Cita
                  </button>
                }
                <button type="button" class="table-action-btn btn-reschedule" title="Reprogramar Cita" (click)="openRescheduleModal(item)">
                  <span>🔄</span> Reagendar
                </button>
                <button type="button" class="table-action-btn btn-cancel" title="Cancelar Cita" (click)="confirmCancel(item)">
                  <span>✕</span> Cancelar
                </button>
              }
              @if (item.status === 'Completed' || item.status === 2 || item.status === '2') {
                <span class="table-action-badge badge-completed">
                  <span>✓</span> Atendida / Finalizada
                </span>
              }
              @if (item.status === 'Cancelled' || item.status === 3 || item.status === '3') {
                <span class="table-action-badge badge-cancelled">
                  <span>✕</span> Cancelada
                </span>
              }
            </div>
          </ng-template>
        </app-data-table>
      }

      <!-- MODAL 1: ATENDER CITA (HISTORIA CLÍNICA & SIGNOS VITALES) -->
      <app-modal
        [isOpen]="attendModalOpen()"
        title="Atender Consulta y Completar Cita Médica"
        size="lg"
        [zIndex]="50"
        (closed)="closeAttendModal()">
        
        @if (selectedAppointment(); as app) {
          <form [formGroup]="attendForm" class="space-y-4">
            <!-- Patient & Appointment Summary Card -->
            <div class="patient-summary-card">
              <div class="patient-summary-top">
                <div class="flex items-center gap-2.5">
                  <span class="patient-avatar-circle">👤</span>
                  <div>
                    <span class="patient-title-name">{{ app.patientName }}</span>
                    <span class="patient-subtitle-doc">Doc: {{ app.patientDocument || app.patientDocumentId || 'N/A' }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <span class="patient-schedule-badge">
                    🗓️ {{ app.scheduledAt | date:'dd/MM/yyyy HH:mm' }} ({{ app.durationMinutes }}m)
                  </span>
                </div>
              </div>
              <div class="patient-summary-bottom">
                <span>👨‍⚕️ <b>Especialista:</b> {{ app.specialistName }}</span>
                <span>🩺 <b>Procedimiento:</b> {{ app.interventionName || app.interventionTypeName || 'Consulta General' }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Diagnóstico Clínico *</label>
              <input 
                type="text" 
                formControlName="diagnosis" 
                class="form-control" 
                placeholder="Ej. Diagnóstico principal, hallazgos clínicos..." />
              @if (attendForm.get('diagnosis')?.touched && attendForm.get('diagnosis')?.hasError('required')) {
                <span class="field-error mt-1 block">El diagnóstico es obligatorio para completar la atención.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Plan de Tratamiento y Procedimiento Realizado</label>
              <textarea 
                formControlName="treatment" 
                class="form-control" 
                rows="2" 
                placeholder="Procedimiento ejecutado, maniobras quirúrgicas, medicación administrada..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Notas de Evolución e Indicaciones</label>
              <textarea 
                formControlName="notes" 
                class="form-control" 
                rows="2" 
                placeholder="Observaciones clínicas, signos de alarma informados al paciente..."></textarea>
            </div>

            <!-- Signos Vitales y Antropometría -->
            <div class="vitals-panel">
              <span class="vitals-panel-title">Signos Vitales y Antropometría</span>
              <div class="vitals-grid">
                <div class="vital-item">
                  <label class="vital-label">P. Sistólica</label>
                  <input type="number" formControlName="systolicBP" class="form-control vital-input" placeholder="120" min="30" max="300" />
                </div>
                <div class="vital-item">
                  <label class="vital-label">P. Diastólica</label>
                  <input type="number" formControlName="diastolicBP" class="form-control vital-input" placeholder="80" min="20" max="200" />
                </div>
                <div class="vital-item">
                  <label class="vital-label">Pulso (lpm)</label>
                  <input type="number" formControlName="heartRateBpm" class="form-control vital-input" placeholder="72" min="20" max="300" />
                </div>
                <div class="vital-item">
                  <label class="vital-label">Temp (°C)</label>
                  <input type="number" step="0.1" formControlName="temperatureCelsius" class="form-control vital-input" placeholder="36.5" min="25" max="45" />
                </div>
                <div class="vital-item">
                  <label class="vital-label">Sat O2 (%)</label>
                  <input type="number" formControlName="oxygenSaturation" class="form-control vital-input" placeholder="98" min="50" max="100" />
                </div>
                <div class="vital-item">
                  <label class="vital-label">Peso (kg)</label>
                  <input type="number" step="0.1" formControlName="weightKg" class="form-control vital-input" placeholder="70" min="0.1" max="500" />
                </div>
                <div class="vital-item">
                  <label class="vital-label">Talla (cm)</label>
                  <input type="number" step="0.1" formControlName="heightCm" class="form-control vital-input" placeholder="170" min="10" max="300" />
                </div>
              </div>
            </div>

            <!-- TARJETA ENLACE A MODAL 2 DE RECETA MÉDICA -->
            <div class="rx-banner-card">
              <div>
                <span class="rx-banner-title">💊 Receta / Fórmula Médica</span>
                <span class="rx-banner-desc">
                  @if (pendingPrescriptionItems().length === 0) {
                    No se ha adjuntado receta a esta consulta.
                  } @else {
                    <b>{{ pendingPrescriptionItems().length }} medicamento(s)</b> adjunto(s) a la fórmula médica.
                  }
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  class="btn btn-sm btn-primary border-none" 
                  (click)="openPrescriptionModal()">
                  @if (pendingPrescriptionItems().length === 0) {
                    💊 + Emitir Receta
                  } @else {
                    📝 Ver / Editar Receta ({{ pendingPrescriptionItems().length }})
                  }
                </button>
                @if (pendingPrescriptionItems().length > 0) {
                  <button 
                    type="button" 
                    class="btn btn-sm btn-remove-rx" 
                    title="Quitar Receta" 
                    (click)="clearPrescription()">
                    ✕ Quitar
                  </button>
                }
              </div>
            </div>
          </form>
        }

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary font-medium" (click)="closeAttendModal()">Cancelar</button>
          <button 
            type="button" 
            class="btn btn-success font-semibold border-none" 
            [disabled]="attendForm.invalid || savingAttendance()" 
            (click)="saveAttendance()">
            @if (savingAttendance()) {
              <span class="spinner-sm mr-1.5"></span>
            }
            ✓ Completar y Guardar Atención
          </button>
        </div>
      </app-modal>

      <!-- MODAL 2: EMITIR RECETA / FÓRMULA MÉDICA -->
      <app-modal
        [isOpen]="prescriptionModalOpen()"
        title="Emitir Receta / Fórmula Médica"
        size="lg"
        [zIndex]="70"
        (closed)="closePrescriptionModal()">
        
        <div class="space-y-4">
          @if (selectedAppointment(); as app) {
            <div class="rx-modal-patient-card">
              <div>
                <span class="rx-patient-name">Paciente: {{ app.patientName }}</span>
                <span class="rx-patient-doc">Doc: {{ app.patientDocument || app.patientDocumentId || 'N/A' }}</span>
              </div>
              <div class="text-right">
                <span class="rx-specialist-name">👨‍⚕️ {{ app.specialistName }}</span>
                <span class="rx-procedure-name">{{ app.interventionName || app.interventionTypeName || 'Consulta' }}</span>
              </div>
            </div>
          }

          <div class="rx-section-header">
            <span class="rx-section-title">Medicamentos Formulados ({{ pendingPrescriptionItems().length }})</span>
            <button 
              type="button" 
              class="btn btn-primary btn-sm font-semibold" 
              (click)="openMedicationModal()">
              + Agregar Medicamento
            </button>
          </div>

          @if (pendingPrescriptionItems().length === 0) {
            <div class="rx-empty-box">
              <span class="rx-empty-icon">💊</span>
              <p class="rx-empty-title">Aún no hay medicamentos en esta receta.</p>
              <p class="rx-empty-subtitle">Haga clic a continuación para añadir fármacos con sus dosis, frecuencia y duración.</p>
              <button type="button" class="btn btn-primary btn-sm mt-2" (click)="openMedicationModal()">
                + Agregar Primer Medicamento
              </button>
            </div>
          } @else {
            <div class="rx-items-list">
              @for (med of pendingPrescriptionItems(); track $index; let idx = $index) {
                <div class="rx-item-card">
                  <div class="rx-item-info">
                    <span class="rx-item-name">
                      💊 {{ med.medicationName }}
                    </span>
                    <div class="rx-item-meta">
                      <span><b>Dosis:</b> {{ med.dosage }}</span>
                      <span>•</span>
                      <span><b>Frecuencia:</b> {{ med.frequency }}</span>
                      <span>•</span>
                      <span><b>Duración:</b> {{ med.durationDays }} días</span>
                    </div>
                    @if (med.instructions) {
                      <div class="rx-item-instrux">
                        <b>Indicaciones:</b> {{ med.instructions }}
                      </div>
                    }
                  </div>
                  <button 
                    type="button" 
                    class="rx-item-delete-btn" 
                    title="Eliminar medicamento"
                    (click)="removePrescriptionItem(idx)">
                    🗑️
                  </button>
                </div>
              }
            </div>
          }

          <div class="form-group pt-2">
            <label class="form-label">Notas / Observaciones Generales de la Receta</label>
            <textarea 
              [ngModel]="prescriptionNotes()" 
              (ngModelChange)="prescriptionNotes.set($event)"
              class="form-control" 
              rows="2" 
              placeholder="Indicaciones generales, precauciones de uso o recomendaciones no farmacológicas..."></textarea>
          </div>
        </div>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary font-medium" (click)="closePrescriptionModal()">Volver a la Consulta</button>
          <button type="button" class="btn btn-primary font-semibold" (click)="closePrescriptionModal()">
            ✓ Confirmar Receta
          </button>
        </div>
      </app-modal>

      <!-- MODAL 3: AGREGAR MEDICAMENTO INDIVIDUAL -->
      <app-modal
        [isOpen]="medicationModalOpen()"
        title="Agregar Medicamento a la Receta"
        size="md"
        [zIndex]="90"
        (closed)="closeMedicationModal()">
        
        <form [formGroup]="medicationForm" class="space-y-3.5">
          <div class="form-group">
            <label class="form-label">Nombre del Fármaco / Medicamento *</label>
            <input 
              type="text" 
              formControlName="medicationName" 
              class="form-control" 
              placeholder="Ej. Amoxicilina 500 mg / Ibuprofeno 400 mg" />
            @if (medicationForm.get('medicationName')?.touched && medicationForm.get('medicationName')?.hasError('required')) {
              <span class="field-error mt-1 block">El nombre del medicamento es obligatorio.</span>
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Dosis *</label>
              <input 
                type="text" 
                formControlName="dosage" 
                class="form-control" 
                placeholder="Ej. 1 cápsula / 10 ml" />
              @if (medicationForm.get('dosage')?.touched && medicationForm.get('dosage')?.hasError('required')) {
                <span class="field-error mt-1 block">La dosis es requerida.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Frecuencia *</label>
              <input 
                type="text" 
                formControlName="frequency" 
                class="form-control" 
                placeholder="Ej. Cada 8 horas" />
              @if (medicationForm.get('frequency')?.touched && medicationForm.get('frequency')?.hasError('required')) {
                <span class="field-error mt-1 block">La frecuencia es requerida.</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Duración del Tratamiento (Días) *</label>
            <input 
              type="number" 
              formControlName="durationDays" 
              class="form-control" 
              placeholder="7" 
              min="1" />
            @if (medicationForm.get('durationDays')?.touched && medicationForm.get('durationDays')?.invalid) {
              <span class="field-error mt-1 block">Ingrese una cantidad válida de días (mínimo 1).</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Indicaciones Específicas de Uso</label>
            <textarea 
              formControlName="instructions" 
              class="form-control" 
              rows="2" 
              placeholder="Ej. Tomar con abundante agua después de las comidas principales. Completar el ciclo indicado."></textarea>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary font-medium" (click)="closeMedicationModal()">Cancelar</button>
          <button 
            type="button" 
            class="btn btn-primary font-semibold" 
            [disabled]="medicationForm.invalid" 
            (click)="addMedicationToPrescription()">
            + Añadir a la Receta
          </button>
        </div>
      </app-modal>

      <!-- MODAL REPROGRAMACIÓN -->
      <app-modal 
        [isOpen]="rescheduleModalOpen()" 
        title="Reprogramar Cita Médica" 
        size="lg"
        (closed)="closeRescheduleModal()">
        
        @if (selectedAppointment(); as app) {
          <div class="space-y-4">
            <!-- Patient & Current Appointment Info Card -->
            <div class="reschedule-info-card">
              <div class="reschedule-info-top">
                <div class="flex items-center gap-2.5">
                  <span class="reschedule-avatar">👤</span>
                  <div>
                    <span class="reschedule-patient-name">{{ app.patientName }}</span>
                    <span class="reschedule-patient-doc">Doc: {{ app.patientDocument || app.patientDocumentId || 'N/A' }}</span>
                  </div>
                </div>
                <span class="reschedule-badge">
                  Cita a Reprogramar
                </span>
              </div>
              
              <div class="reschedule-info-grid">
                <div>
                  <span class="reschedule-label">Especialista & Procedimiento</span>
                  <span class="reschedule-value-main">👨‍⚕️ {{ app.specialistName }}</span>
                  <span class="reschedule-value-sub">🩺 {{ app.interventionName || app.interventionTypeName || 'Consulta' }}</span>
                </div>
                <div>
                  <span class="reschedule-label">Horario Actual</span>
                  <span class="reschedule-value-time">
                    🗓️ {{ app.scheduledAt | date:'dd/MM/yyyy HH:mm' }} ({{ app.durationMinutes }}m)
                  </span>
                </div>
              </div>
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
                <span class="text-xs text-slate-500 flex items-center gap-1.5 my-2">
                  <span class="spinner-sm"></span> Consultando turnos disponibles...
                </span>
              } @else if (newSlots().length === 0) {
                <div class="p-4 text-center text-slate-500 border border-dashed rounded-xl">
                  <p class="text-xs font-medium m-0">No hay turnos configurados para este especialista en la fecha seleccionada.</p>
                </div>
              } @else {
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-1">
                  @for (slot of newSlots(); track slot.startTime) {
                    <button 
                      type="button" 
                      [disabled]="!slot.isAvailable"
                      class="slot-btn p-2.5 rounded-lg text-xs font-bold text-center border transition-all"
                      [class.slot-available]="slot.isAvailable"
                      [class.slot-occupied]="!slot.isAvailable"
                      [class.slot-selected]="selectedNewSlot()?.startTime === slot.startTime"
                      (click)="selectedNewSlot.set(slot)">
                      {{ formatSlotTime(slot.startTime) }} - {{ formatSlotTime(slot.endTime) }}
                      @if (!slot.isAvailable) {
                        <span class="block text-[10px] text-rose-500 font-bold">Ocupado</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>

            @if (selectedNewSlot()) {
              <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <span class="text-base">✓</span>
                <span>Nuevo turno seleccionado: <b>{{ newDate }}</b> a las <b>{{ formatSlotTime(selectedNewSlot()!.startTime) }}</b></span>
              </div>
            }
          </div>
        }

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary font-medium" (click)="closeRescheduleModal()">Cancelar</button>
          <button 
            type="button" 
            class="btn btn-primary font-semibold" 
            [disabled]="!selectedNewSlot() || savingReschedule()" 
            (click)="saveReschedule()">
            @if (savingReschedule()) {
              <span class="spinner-sm mr-1.5"></span>
            }
            Reprogramar Cita
          </button>
        </div>
      </app-modal>

      <!-- MODAL 4: REGISTRAR COBRO / PAGO -->
      <app-payment-modal
        [isOpen]="paymentModalOpen()"
        [scheduling]="selectedSchedulingForPayment()"
        [existingPayment]="selectedPayment()"
        (closed)="closePaymentModal()"
        (paymentSaved)="onPaymentSaved($event)">
      </app-payment-modal>

      <!-- MODAL 5: RECIBO DE PAGO / TICKET IMPRIMIBLE -->
      <app-payment-receipt-modal
        [isOpen]="paymentReceiptModalOpen()"
        [payment]="selectedPayment()"
        [scheduling]="selectedSchedulingForPayment()"
        [companyName]="companyContext.activeCompanyName()"
        [companyTaxId]="companyContext.activeCompany()?.taxId || ''"
        [companyPhone]="companyContext.activeCompany()?.phone || ''"
        [companyAddress]="companyContext.activeCompany()?.address || ''"
        (closed)="closeReceiptModal()">
      </app-payment-receipt-modal>

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

    .slot-available {
      background: #ecfdf5;
      border-color: #6ee7b7;
      color: #065f46;
      cursor: pointer;
      font-weight: 700;
    }
    .slot-available:hover {
      background: #d1fae5;
      border-color: #34d399;
    }
    :host-context(.dark) .slot-available {
      background: rgba(16, 185, 129, 0.2);
      border-color: rgba(16, 185, 129, 0.5);
      color: #6ee7b7;
      font-weight: 700;
    }
    :host-context(.dark) .slot-available:hover {
      background: rgba(16, 185, 129, 0.3);
      border-color: #34d399;
    }

    .slot-occupied {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #64748b;
      cursor: not-allowed;
      opacity: 0.7;
      font-weight: 600;
    }
    :host-context(.dark) .slot-occupied {
      background: #1e293b;
      border-color: #334155;
      color: #94a3b8;
      font-weight: 600;
    }

    .slot-selected {
      background: #0284c7 !important;
      border-color: #0369a1 !important;
      color: #ffffff !important;
      font-weight: 700;
      box-shadow: 0 0 0 2px var(--primary-glow);
    }
  `]
})
export class SchedulingListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly paymentService = inject(PaymentService);
  readonly companyContext = inject(CompanyContextService);

  readonly schedulings = signal<SchedulingDto[]>([]);
  readonly specialists = signal<SpecialistDto[]>([]);
  readonly loading = signal<boolean>(true);

  // View Mode
  readonly activeView = signal<'list' | 'calendar'>('list');

  // Filters
  readonly filterMode = signal<'ALL' | 'MINE'>(this.authService.isOnlySpecialist() ? 'MINE' : 'ALL');
  readonly selectedSpecialistId = signal<string>('');

  readonly filteredSchedulings = computed(() => {
    let list = this.schedulings();
    
    if (this.filterMode() === 'MINE' && this.authService.specialistId()) {
      const mySpecId = this.authService.specialistId();
      return list.filter(s => s.specialistId === mySpecId);
    }

    if (this.selectedSpecialistId()) {
      return list.filter(s => s.specialistId === this.selectedSpecialistId());
    }

    return list;
  });

  // Payments
  readonly paymentModalOpen = signal<boolean>(false);
  readonly paymentReceiptModalOpen = signal<boolean>(false);
  readonly selectedPayment = signal<PaymentDto | null>(null);
  readonly selectedSchedulingForPayment = signal<SchedulingDto | null>(null);

  // Attend Modal (Modal 1)
  readonly attendModalOpen = signal<boolean>(false);
  readonly savingAttendance = signal<boolean>(false);

  readonly attendForm: FormGroup = this.fb.group({
    diagnosis: ['', [Validators.required]],
    treatment: [''],
    notes: [''],
    systolicBP: [null],
    diastolicBP: [null],
    heartRateBpm: [null],
    temperatureCelsius: [null],
    oxygenSaturation: [null],
    weightKg: [null],
    heightCm: [null]
  });

  // Prescription Modal (Modal 2) & Medication Modal (Modal 3)
  readonly prescriptionModalOpen = signal<boolean>(false);
  readonly medicationModalOpen = signal<boolean>(false);
  readonly pendingPrescriptionItems = signal<CreatePrescriptionItemDto[]>([]);
  readonly prescriptionNotes = signal<string>('');

  readonly medicationForm: FormGroup = this.fb.group({
    medicationName: ['', [Validators.required]],
    dosage: ['', [Validators.required]],
    frequency: ['', [Validators.required]],
    durationDays: [3, [Validators.required, Validators.min(1)]],
    instructions: ['']
  });

  // Modal 2 Actions
  openPrescriptionModal(): void {
    this.prescriptionModalOpen.set(true);
  }

  closePrescriptionModal(): void {
    this.prescriptionModalOpen.set(false);
  }

  clearPrescription(): void {
    this.pendingPrescriptionItems.set([]);
    this.prescriptionNotes.set('');
    this.toast.info('Se eliminó la fórmula médica adjunta a la consulta.');
  }

  // Modal 3 Actions
  openMedicationModal(): void {
    this.medicationForm.reset({
      medicationName: '',
      dosage: '',
      frequency: '',
      durationDays: 3,
      instructions: ''
    });
    this.medicationModalOpen.set(true);
  }

  closeMedicationModal(): void {
    this.medicationModalOpen.set(false);
  }

  addMedicationToPrescription(): void {
    if (this.medicationForm.invalid) {
      this.medicationForm.markAllAsTouched();
      return;
    }
    const val = this.medicationForm.value;
    const newItem: CreatePrescriptionItemDto = {
      medicationName: val.medicationName,
      dosage: val.dosage,
      frequency: val.frequency,
      durationDays: Number(val.durationDays) || 1,
      instructions: val.instructions || ''
    };
    this.pendingPrescriptionItems.update(items => [...items, newItem]);
    this.closeMedicationModal();
    this.toast.success(`Medicamento "${newItem.medicationName}" añadido a la receta.`);
  }

  removePrescriptionItem(index: number): void {
    this.pendingPrescriptionItems.update(items => items.filter((_, i) => i !== index));
  }

  // Reschedule Modal
  readonly rescheduleModalOpen = signal<boolean>(false);
  readonly selectedAppointment = signal<SchedulingDto | null>(null);
  readonly newSlots = signal<TimeSlotDto[]>([]);
  readonly selectedNewSlot = signal<TimeSlotDto | null>(null);
  readonly loadingNewSlots = signal<boolean>(false);
  readonly savingReschedule = signal<boolean>(false);

  // Cancel Dialog
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
    { key: 'durationMinutes', label: 'Duración', width: '85px' },
    { key: 'status', label: 'Estado', sortable: true, width: '110px' },
    { key: 'payment', label: 'Pago', sortable: false, width: '130px' }
  ];

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading.set(true);
    forkJoin({
      schedulings: this.http.get<ApiResponse<SchedulingDto[]>>(`${environment.apiUrl}/scheduling`),
      specialists: this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/employees`)
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.schedulings.set(res.schedulings.data || []);
        this.specialists.set(res.specialists.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  loadSchedulings(): void {
    this.http.get<ApiResponse<SchedulingDto[]>>(`${environment.apiUrl}/scheduling`).subscribe({
      next: (res) => {
        this.schedulings.set(res.data || []);
      }
    });
  }

  setFilterMode(mode: 'ALL' | 'MINE'): void {
    this.filterMode.set(mode);
    if (mode === 'MINE') {
      this.selectedSpecialistId.set('');
    }
  }

  onSpecialistDropdownChange(specId: string): void {
    this.selectedSpecialistId.set(specId);
    if (specId) {
      this.filterMode.set('ALL');
    }
  }

  getStatusVariant(status: string | number): 'primary' | 'success' | 'danger' | 'warning' | 'info' {
    switch (String(status)) {
      case 'Completed':
      case '2': return 'success';
      case 'Confirmed':
      case '1': return 'primary';
      case 'Cancelled':
      case '3': return 'danger';
      case 'Rescheduled':
      case '4': return 'warning';
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

  // Attend Flow
  openAttendModal(item: SchedulingDto): void {
    if (!this.authService.isAdmin() && !this.authService.isSpecialist()) {
      return;
    }
    this.selectedAppointment.set(item);
    this.pendingPrescriptionItems.set([]);
    this.prescriptionNotes.set('');
    this.attendForm.reset({
      diagnosis: '',
      treatment: item.interventionName ? `Procedimiento realizado: ${item.interventionName}` : '',
      notes: item.notes ? `Nota inicial de cita: ${item.notes}` : '',
      systolicBP: null,
      diastolicBP: null,
      heartRateBpm: null,
      temperatureCelsius: null,
      oxygenSaturation: null,
      weightKg: null,
      heightCm: null
    });
    this.attendModalOpen.set(true);
  }

  closeAttendModal(): void {
    this.attendModalOpen.set(false);
    this.prescriptionModalOpen.set(false);
    this.medicationModalOpen.set(false);
    this.selectedAppointment.set(null);
  }

  saveAttendance(): void {
    const app = this.selectedAppointment();
    if (!app) return;

    if (this.attendForm.invalid) {
      this.attendForm.markAllAsTouched();
      return;
    }

    const formValue = this.attendForm.value;
    const medItems = this.pendingPrescriptionItems();
    const rxNotes = this.prescriptionNotes();

    this.savingAttendance.set(true);

    const recordPayload: CreateMedicalRecordDto = {
      patientId: app.patientId,
      interventionTypeId: app.interventionTypeId || null,
      recordDate: new Date().toISOString(),
      diagnosis: formValue.diagnosis,
      treatment: formValue.treatment || null,
      notes: formValue.notes || null,
      systolicBP: formValue.systolicBP ? Number(formValue.systolicBP) : null,
      diastolicBP: formValue.diastolicBP ? Number(formValue.diastolicBP) : null,
      heartRateBpm: formValue.heartRateBpm ? Number(formValue.heartRateBpm) : null,
      temperatureCelsius: formValue.temperatureCelsius ? Number(formValue.temperatureCelsius) : null,
      oxygenSaturation: formValue.oxygenSaturation ? Number(formValue.oxygenSaturation) : null,
      weightKg: formValue.weightKg ? Number(formValue.weightKg) : null,
      heightCm: formValue.heightCm ? Number(formValue.heightCm) : null
    };

    // 1. Guardar Historia Clínica -> 2. Si hay receta, guardar Prescription vinculada -> 3. Marcar Cita como Completed
    this.http.post<ApiResponse<MedicalRecordDto>>(`${environment.apiUrl}/medical-records`, recordPayload)
      .pipe(
        switchMap(recordRes => {
          const medicalRecordId = recordRes.data.id;
          if (medItems && medItems.length > 0) {
            const rxPayload: CreatePrescriptionDto = {
              patientId: app.patientId,
              employeeId: app.employeeId || app.specialistId,
              specialistId: app.specialistId,
              medicalRecordId: medicalRecordId,
              prescriptionDate: new Date().toISOString(),
              notes: rxNotes || null,
              items: medItems.map(it => ({
                medicationName: it.medicationName,
                dosage: it.dosage,
                frequency: it.frequency,
                durationDays: Number(it.durationDays) || 1,
                instructions: it.instructions || null
              }))
            };
            return this.http.post<ApiResponse<PrescriptionDto>>(`${environment.apiUrl}/prescriptions`, rxPayload);
          }
          return of(null);
        }),
        switchMap(() => this.http.patch<ApiResponse>(`${environment.apiUrl}/scheduling/${app.id}/status`, { status: 'Completed' }))
      )
      .subscribe({
        next: () => {
          this.savingAttendance.set(false);
          if (medItems && medItems.length > 0) {
            this.toast.success('¡Cita atendida, historia clínica y receta médica guardadas con éxito!');
          } else {
            this.toast.success('¡Cita atendida y completada con éxito! La historia clínica ha sido registrada.');
          }
          this.closeAttendModal();
          this.loadSchedulings();
        },
        error: () => {
          this.savingAttendance.set(false);
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
    const empId = app.employeeId || app.specialistId;
    this.http.get<ApiResponse<TimeSlotDto[]>>(`${environment.apiUrl}/employees/${empId}/slots?date=${this.newDate}`).subscribe({
      next: (res) => {
        this.loadingNewSlots.set(false);
        this.newSlots.set(res.data || []);
      },
      error: () => this.loadingNewSlots.set(false)
    });
  }

  formatSlotTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  saveReschedule(): void {
    const app = this.selectedAppointment();
    const slot = this.selectedNewSlot();
    if (!app || !slot) return;

    this.savingReschedule.set(true);
    this.http.patch<ApiResponse>(`${environment.apiUrl}/scheduling/${app.id}/reschedule`, { newScheduledAt: slot.startTime }).subscribe({
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

  // Payment methods
  openPaymentModal(item: SchedulingDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedSchedulingForPayment.set(item);
    
    if (item.paymentId) {
      this.paymentService.getPaymentById(item.paymentId).subscribe({
        next: (res) => {
          this.selectedPayment.set(res.data || null);
          this.paymentModalOpen.set(true);
        },
        error: () => {
          this.selectedPayment.set(null);
          this.paymentModalOpen.set(true);
        }
      });
    } else {
      this.selectedPayment.set(null);
      this.paymentModalOpen.set(true);
    }
  }

  closePaymentModal(): void {
    this.paymentModalOpen.set(false);
    this.selectedPayment.set(null);
    this.selectedSchedulingForPayment.set(null);
  }

  openReceiptModal(item: SchedulingDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedSchedulingForPayment.set(item);

    if (item.paymentId) {
      this.paymentService.getPaymentById(item.paymentId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.selectedPayment.set(res.data);
            this.paymentReceiptModalOpen.set(true);
          } else {
            this.toast.error('No se encontró el registro de pago.');
          }
        },
        error: () => this.toast.error('Error al consultar comprobante.')
      });
    } else {
      this.paymentService.getPaymentBySchedulingId(item.id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.selectedPayment.set(res.data);
            this.paymentReceiptModalOpen.set(true);
          } else {
            this.toast.info('No hay cobro registrado para esta cita aún.');
            this.openPaymentModal(item);
          }
        },
        error: () => this.toast.error('Error al consultar comprobante.')
      });
    }
  }

  closeReceiptModal(): void {
    this.paymentReceiptModalOpen.set(false);
    this.selectedPayment.set(null);
    this.selectedSchedulingForPayment.set(null);
  }

  onPaymentSaved(payment: PaymentDto): void {
    this.loadSchedulings();
    this.selectedPayment.set(payment);
    this.paymentReceiptModalOpen.set(true);
  }

  // Calendar Interactions
  onCalendarAppointmentSelected(item: SchedulingDto): void {
    if (item.status === 'Scheduled' || item.status === 'Confirmed') {
      if (this.authService.isAdmin() || this.authService.isSpecialist()) {
        this.openAttendModal(item);
      }
    } else if (item.paymentStatus === 'Paid') {
      this.openReceiptModal(item);
    } else if (item.status === 'Completed') {
      this.openPaymentModal(item);
    }
  }

  onCalendarEmptySlotClicked(slot: { date: Date; hour: number; minute: number; specialistId?: string }): void {
    const dateStr = slot.date.toISOString().substring(0, 10);
    const queryParams: any = { date: dateStr };
    if (slot.specialistId) {
      queryParams.specialistId = slot.specialistId;
    }
    this.router.navigate(['/scheduling/new'], { queryParams });
  }
}
