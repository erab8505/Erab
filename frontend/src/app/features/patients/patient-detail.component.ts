import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, MedicalRecordDto, PatientDto, PrescriptionDto, SchedulingDto, SpecialistDto } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { CompanyContextService } from '../../core/services/company-context.service';
import { ToastService } from '../../core/services/toast.service';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BadgeComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- Top Navigation & Header -->
      <div class="page-header">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <a routerLink="/patients" class="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              &larr; Volver al Directorio de Pacientes
            </a>
          </div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold">{{ patient()?.fullName || 'Cargando Paciente...' }}</h1>
            @if (patient()?.bloodType) {
              <span class="text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full">
                🩸 {{ patient()?.bloodType }}
              </span>
            }
          </div>
          <p class="text-slate-500 text-sm mt-0.5">
            Doc: <b>{{ patient()?.documentId }}</b> | Edad: <b>{{ patient()?.age }} años</b> | Tel: <b>{{ patient()?.phone || 'N/A' }}</b>
          </p>
        </div>

        <div class="header-actions">
          <a [routerLink]="['/scheduling/new']" [queryParams]="{ patientId: patientId() }" class="btn btn-primary">
            🗓️ Agendar Cita
          </a>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'info'" (click)="setTab('info')">
          📋 Datos Personales
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'appointments'" (click)="setTab('appointments')">
          🗓️ Citas ({{ appointments().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'records'" (click)="setTab('records')">
          🩺 Historia Clínica ({{ medicalRecords().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'prescriptions'" (click)="setTab('prescriptions')">
          💊 Recetas y Fórmulas ({{ prescriptions().length }})
        </button>
      </div>

      <!-- TAB 1: DATOS PERSONALES -->
      @if (activeTab() === 'info') {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="card p-5">
            <h2 class="text-base font-semibold mb-3 border-b pb-2">Información Demográfica</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span class="text-slate-500">Documento de Identidad:</span>
                <span class="font-medium">{{ patient()?.documentId }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span class="text-slate-500">Nombre Completo:</span>
                <span class="font-medium">{{ patient()?.fullName }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span class="text-slate-500">Fecha de Nacimiento:</span>
                <span class="font-medium">{{ patient()?.dateOfBirth | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span class="text-slate-500">Edad Calculada:</span>
                <span class="font-medium">{{ patient()?.age }} años</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span class="text-slate-500">Género:</span>
                <span class="font-medium">{{ patient()?.gender === 'M' ? 'Masculino' : patient()?.gender === 'F' ? 'Femenino' : 'Otro' }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span class="text-slate-500">Grupo Sanguíneo (RH):</span>
                <span class="font-medium">{{ patient()?.bloodType || 'No registrado' }}</span>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <h2 class="text-base font-semibold mb-3 border-b pb-2">Contacto y Antecedentes</h2>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span class="text-slate-500">Teléfono:</span>
                <span class="font-medium">{{ patient()?.phone || 'Sin registrar' }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span class="text-slate-500">Correo Electrónico:</span>
                <span class="font-medium">{{ patient()?.email || 'Sin registrar' }}</span>
              </div>
              <div class="pt-2">
                <span class="text-slate-500 block mb-1 font-medium">Alergias y Condiciones Especiales:</span>
                <div class="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded text-rose-800 dark:text-rose-300">
                  {{ patient()?.allergies || 'Sin alergias registradas.' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: CITAS / SCHEDULING -->
      @if (activeTab() === 'appointments') {
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold m-0">Historial de Citas Médicas</h2>
            <a [routerLink]="['/scheduling/new']" [queryParams]="{ patientId: patientId() }" class="btn btn-primary btn-sm">
              + Nueva Cita
            </a>
          </div>

          @if (appointments().length === 0) {
            <div class="p-8 text-center text-slate-400">
              <p>No hay citas registradas para este paciente.</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b">
                  <tr>
                    <th class="p-3">Fecha y Hora</th>
                    <th class="p-3">Especialista</th>
                    <th class="p-3">Procedimiento</th>
                    <th class="p-3">Duración</th>
                    <th class="p-3">Estado</th>
                    <th class="p-3">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  @for (app of appointments(); track app.id) {
                    <tr class="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td class="p-3 font-medium">{{ app.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td class="p-3">👨‍⚕️ {{ app.specialistName }}</td>
                      <td class="p-3">{{ app.interventionName }}</td>
                      <td class="p-3">{{ app.durationMinutes }} min</td>
                      <td class="p-3">
                        <app-badge [variant]="getStatusVariant(app.status)" [text]="app.status"></app-badge>
                      </td>
                      <td class="p-3 text-slate-500">{{ app.notes || '-' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- TAB 3: NOTAS MÉDICAS / HISTORIA CLÍNICA -->
      @if (activeTab() === 'records') {
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold m-0">Consultas y Notas de Evolución</h2>
            @if (canCreateClinical()) {
              <button type="button" class="btn btn-primary btn-sm" (click)="openCreateRecordModal()">
                + Registrar Consulta
              </button>
            }
          </div>

          @if (medicalRecords().length === 0) {
            <div class="card p-8 text-center text-slate-400">
              <p>No hay notas clínicas registradas.</p>
            </div>
          } @else {
            @for (rec of medicalRecords(); track rec.id) {
              <div class="card p-5 space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                  <div>
                    <span class="font-bold text-slate-900 dark:text-slate-100">Consulta: {{ rec.consultationDate | date:'dd/MM/yyyy HH:mm' }}</span>
                    <span class="text-slate-500 text-xs block">Atendido por: 👨‍⚕️ <b>{{ rec.specialistName }}</b></span>
                  </div>
                </div>

                <!-- Vital Signs Bar -->
                <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                  <div><span class="text-slate-400 block">P.A:</span> <b>{{ rec.bloodPressure || '-' }}</b></div>
                  <div><span class="text-slate-400 block">Pulso:</span> <b>{{ rec.heartRateBpm ? rec.heartRateBpm + ' bpm' : '-' }}</b></div>
                  <div><span class="text-slate-400 block">Temp:</span> <b>{{ rec.temperatureCelsius ? rec.temperatureCelsius + ' °C' : '-' }}</b></div>
                  <div><span class="text-slate-400 block">FR:</span> <b>{{ rec.respiratoryRateBpm ? rec.respiratoryRateBpm + ' rpm' : '-' }}</b></div>
                  <div><span class="text-slate-400 block">Sat O2:</span> <b>{{ rec.oxygenSaturationPct ? rec.oxygenSaturationPct + ' %' : '-' }}</b></div>
                  <div><span class="text-slate-400 block">Peso:</span> <b>{{ rec.weightKg ? rec.weightKg + ' kg' : '-' }}</b></div>
                  <div><span class="text-slate-400 block">Talla:</span> <b>{{ rec.heightCm ? rec.heightCm + ' cm' : '-' }}</b></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Motivo de Consulta:</span>
                    <p class="m-0 text-slate-600 dark:text-slate-400">{{ rec.reasonForVisit }}</p>
                  </div>
                  <div>
                    <span class="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Diagnóstico:</span>
                    <p class="m-0 font-medium text-blue-700 dark:text-blue-300">{{ rec.diagnosis }}</p>
                  </div>
                </div>

                <div class="text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span class="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Plan de Tratamiento / Conducta:</span>
                  <p class="m-0 text-slate-600 dark:text-slate-400">{{ rec.treatmentPlan }}</p>
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- TAB 4: RECETAS / PRESCRIPCIONES -->
      @if (activeTab() === 'prescriptions') {
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold m-0">Fórmulas Médicas Emitidas</h2>
            @if (canCreateClinical()) {
              <button type="button" class="btn btn-primary btn-sm" (click)="openCreatePrescriptionModal()">
                + Emitir Nueva Receta
              </button>
            }
          </div>

          @if (prescriptions().length === 0) {
            <div class="card p-8 text-center text-slate-400">
              <p>No se han emitido fórmulas médicas para este paciente.</p>
            </div>
          } @else {
            @for (rx of prescriptions(); track rx.id) {
              <div class="card p-5 space-y-3">
                <div class="flex items-center justify-between border-b pb-3">
                  <div>
                    <span class="font-bold text-slate-900 dark:text-slate-100">Receta Médica - {{ rx.prescriptionDate | date:'dd/MM/yyyy' }}</span>
                    <span class="text-slate-500 text-xs block">Prescrito por: 👨‍⚕️ <b>{{ rx.specialistName }}</b></span>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm" (click)="openPrintModal(rx)">
                    🖨️ Imprimir Receta
                  </button>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b">
                      <tr>
                        <th class="p-2">Medicamento</th>
                        <th class="p-2">Dosis</th>
                        <th class="p-2">Frecuencia</th>
                        <th class="p-2">Duración</th>
                        <th class="p-2">Instrucciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of rx.items; track item.id) {
                        <tr class="border-b">
                          <td class="p-2 font-bold">{{ item.medicationName }}</td>
                          <td class="p-2">{{ item.dosage }}</td>
                          <td class="p-2">{{ item.frequency }}</td>
                          <td class="p-2">{{ item.durationDays }} días</td>
                          <td class="p-2 text-slate-500">{{ item.instructions || '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                @if (rx.notes) {
                  <p class="text-xs text-slate-500 m-0"><b>Observaciones generales:</b> {{ rx.notes }}</p>
                }
              </div>
            }
          }
        </div>
      }

      <!-- MODAL CREAR CONSULTA MÉDICA -->
      <app-modal 
        [isOpen]="recordModalOpen()" 
        title="Registrar Consulta Médica" 
        size="lg"
        (closed)="closeRecordModal()">
        
        <form [formGroup]="recordForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Especialista Tratante *</label>
              <select formControlName="specialistId" class="form-select">
                <option value="" disabled>Seleccione especialista...</option>
                @for (doc of specialists(); track doc.id) {
                  <option [value]="doc.id">{{ doc.fullName }} ({{ doc.specialtyName }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Fecha / Hora Consulta *</label>
              <input type="datetime-local" formControlName="consultationDate" class="form-control" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Motivo de Consulta *</label>
            <input type="text" formControlName="reasonForVisit" class="form-control" placeholder="Ej. Dolor torácico opresivo de 2 horas de evolución" />
          </div>

          <!-- Vital Signs Grid -->
          <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-2">Signos Vitales y Antropometría</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              <div>
                <label class="text-xs text-slate-500 block mb-1">P. Arterial</label>
                <input type="text" formControlName="bloodPressure" class="form-control text-xs p-1" placeholder="120/80" />
              </div>
              <div>
                <label class="text-xs text-slate-500 block mb-1">Pulso (bpm)</label>
                <input type="number" formControlName="heartRateBpm" class="form-control text-xs p-1" placeholder="72" />
              </div>
              <div>
                <label class="text-xs text-slate-500 block mb-1">Temp (°C)</label>
                <input type="number" step="0.1" formControlName="temperatureCelsius" class="form-control text-xs p-1" placeholder="36.5" />
              </div>
              <div>
                <label class="text-xs text-slate-500 block mb-1">F. Resp (rpm)</label>
                <input type="number" formControlName="respiratoryRateBpm" class="form-control text-xs p-1" placeholder="18" />
              </div>
              <div>
                <label class="text-xs text-slate-500 block mb-1">Sat O2 (%)</label>
                <input type="number" formControlName="oxygenSaturationPct" class="form-control text-xs p-1" placeholder="98" />
              </div>
              <div>
                <label class="text-xs text-slate-500 block mb-1">Peso (kg)</label>
                <input type="number" step="0.1" formControlName="weightKg" class="form-control text-xs p-1" placeholder="70.5" />
              </div>
              <div>
                <label class="text-xs text-slate-500 block mb-1">Talla (cm)</label>
                <input type="number" step="0.1" formControlName="heightCm" class="form-control text-xs p-1" placeholder="172" />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Diagnóstico Clínico *</label>
            <input type="text" formControlName="diagnosis" class="form-control" placeholder="Ej. Hipertensión Arterial Primaria Grado I" />
          </div>

          <div class="form-group">
            <label class="form-label">Plan de Tratamiento y Recomendaciones *</label>
            <textarea formControlName="treatmentPlan" class="form-control" rows="3" placeholder="Conducta, dieta, solicitud de exámenes de laboratorio..."></textarea>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closeRecordModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="recordForm.invalid || savingRecord()" (click)="saveRecord()">
            @if (savingRecord()) {
              <span class="spinner-sm mr-1.5"></span>
            }
            Guardar Consulta
          </button>
        </div>
      </app-modal>

      <!-- MODAL CREAR RECETA MÉDICA CON MULTI-ITEM -->
      <app-modal 
        [isOpen]="prescriptionModalOpen()" 
        title="Emitir Receta Médica" 
        size="xl"
        (closed)="closePrescriptionModal()">
        
        <form [formGroup]="rxForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Médico Prescriptor *</label>
              <select formControlName="specialistId" class="form-select">
                <option value="" disabled>Seleccione especialista...</option>
                @for (doc of specialists(); track doc.id) {
                  <option [value]="doc.id">{{ doc.fullName }} ({{ doc.specialtyName }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Fecha de Prescripción *</label>
              <input type="date" formControlName="prescriptionDate" class="form-control" />
            </div>
          </div>

          <!-- Items FormArray -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Medicamentos Prescritos</span>
              <button type="button" class="btn btn-secondary btn-sm" (click)="addRxItem()">
                + Agregar Medicamento
              </button>
            </div>

            <div formArrayName="items" class="space-y-3">
              @for (item of rxItems.controls; track $index; let i = $index) {
                <div [formGroupName]="i" class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                  <div class="sm:col-span-2">
                    <label class="text-xs font-semibold block mb-1">Nombre Medicamento *</label>
                    <input type="text" formControlName="medicationName" class="form-control text-xs" placeholder="Ej. Losartán 50mg" />
                  </div>
                  <div>
                    <label class="text-xs font-semibold block mb-1">Dosis *</label>
                    <input type="text" formControlName="dosage" class="form-control text-xs" placeholder="1 tableta" />
                  </div>
                  <div>
                    <label class="text-xs font-semibold block mb-1">Frecuencia *</label>
                    <input type="text" formControlName="frequency" class="form-control text-xs" placeholder="Cada 12 horas" />
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="flex-1">
                      <label class="text-xs font-semibold block mb-1">Días *</label>
                      <input type="number" formControlName="durationDays" class="form-control text-xs" min="1" />
                    </div>
                    @if (rxItems.length > 1) {
                      <button type="button" class="btn btn-danger btn-sm mt-4" (click)="removeRxItem(i)">✕</button>
                    }
                  </div>
                  <div class="sm:col-span-5">
                    <input type="text" formControlName="instructions" class="form-control text-xs" placeholder="Instrucciones adicionales: Tomar con abundante agua después de los alimentos" />
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notas Generales / Indicaciones de la Receta</label>
            <textarea formControlName="notes" class="form-control" rows="2" placeholder="Recomendaciones generales no farmacológicas..."></textarea>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closePrescriptionModal()">Cancelar</button>
          <button type="button" class="btn btn-primary" [disabled]="rxForm.invalid || savingRx()" (click)="savePrescription()">
            @if (savingRx()) {
              <span class="spinner-sm mr-1.5"></span>
            }
            Emitir Receta
          </button>
        </div>
      </app-modal>

      <!-- PRINT MODAL / PREVIEW -->
      <app-modal 
        [isOpen]="printModalOpen()" 
        title="Vista de Impresión de Receta" 
        size="lg"
        (closed)="closePrintModal()">
        
        @if (selectedRxForPrint(); as rx) {
          <div id="printable-rx" class="p-6 bg-white text-slate-900 border rounded-lg space-y-6">
            <!-- Header Letterhead -->
            <div class="flex items-start justify-between border-b pb-4">
              <div>
                <h2 class="text-xl font-bold text-blue-800 m-0">{{ companyContext.activeCompanyName() }}</h2>
                <p class="text-xs text-slate-500 m-0">NIT: {{ companyContext.activeCompany()?.taxId || 'N/A' }} | Tel: {{ companyContext.activeCompany()?.phone || 'N/A' }}</p>
                <p class="text-xs text-slate-500 m-0">{{ companyContext.activeCompany()?.address || '' }}</p>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold uppercase text-slate-400 block">RECETA MÉDICA</span>
                <span class="text-sm font-semibold">{{ rx.prescriptionDate | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <!-- Patient and Doctor Information -->
            <div class="grid grid-cols-2 gap-4 text-xs p-3 bg-slate-50 rounded border">
              <div>
                <span class="text-slate-500 block">Paciente:</span>
                <b class="text-sm">{{ patient()?.fullName }}</b>
                <span class="block">Doc: {{ patient()?.documentId }} | Edad: {{ patient()?.age }} años</span>
              </div>
              <div>
                <span class="text-slate-500 block">Médico Tratante:</span>
                <b class="text-sm">{{ rx.specialistName }}</b>
              </div>
            </div>

            <!-- Medication List -->
            <div>
              <h3 class="text-sm font-bold uppercase text-slate-700 border-b pb-1 mb-2">Rp. Prescripción Farmacológica</h3>
              <table class="w-full text-xs text-left">
                <thead class="border-b bg-slate-100 font-semibold">
                  <tr>
                    <th class="p-2">Medicamento</th>
                    <th class="p-2">Dosis</th>
                    <th class="p-2">Frecuencia</th>
                    <th class="p-2">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of rx.items; track item.id) {
                    <tr class="border-b">
                      <td class="p-2">
                        <b>{{ item.medicationName }}</b>
                        @if (item.instructions) {
                          <span class="block text-slate-500 italic">{{ item.instructions }}</span>
                        }
                      </td>
                      <td class="p-2">{{ item.dosage }}</td>
                      <td class="p-2">{{ item.frequency }}</td>
                      <td class="p-2">{{ item.durationDays }} días</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (rx.notes) {
              <div class="text-xs">
                <b>Indicaciones:</b>
                <p class="m-0 text-slate-600">{{ rx.notes }}</p>
              </div>
            }

            <!-- Signature Footer -->
            <div class="pt-8 flex justify-end">
              <div class="text-center border-t border-slate-400 pt-2 w-56">
                <span class="text-xs font-semibold block">{{ rx.specialistName }}</span>
                <span class="text-xs text-slate-500 block">Firma y Sello Médico</span>
              </div>
            </div>
          </div>
        }

        <div modal-footer class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary" (click)="closePrintModal()">Cerrar</button>
          <button type="button" class="btn btn-primary" (click)="printDocument()">
            🖨️ Imprimir
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .tab-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      overflow-x: auto;
    }
    .tab-btn {
      padding: 0.625rem 1rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--text-color, #0f172a);
    }
    .tab-btn.active {
      color: #2563eb;
      border-bottom-color: #2563eb;
      font-weight: 600;
    }
  `]
})
export class PatientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  readonly companyContext = inject(CompanyContextService);
  private readonly toast = inject(ToastService);

  readonly patientId = signal<string>('');
  readonly patient = signal<PatientDto | null>(null);
  readonly appointments = signal<SchedulingDto[]>([]);
  readonly medicalRecords = signal<MedicalRecordDto[]>([]);
  readonly prescriptions = signal<PrescriptionDto[]>([]);
  readonly specialists = signal<SpecialistDto[]>([]);

  readonly activeTab = signal<'info' | 'appointments' | 'records' | 'prescriptions'>('info');

  readonly recordModalOpen = signal<boolean>(false);
  readonly savingRecord = signal<boolean>(false);

  readonly prescriptionModalOpen = signal<boolean>(false);
  readonly savingRx = signal<boolean>(false);

  readonly printModalOpen = signal<boolean>(false);
  readonly selectedRxForPrint = signal<PrescriptionDto | null>(null);

  readonly recordForm: FormGroup = this.fb.group({
    specialistId: ['', [Validators.required]],
    consultationDate: [new Date().toISOString().substring(0, 16), [Validators.required]],
    reasonForVisit: ['', [Validators.required]],
    diagnosis: ['', [Validators.required]],
    treatmentPlan: ['', [Validators.required]],
    bloodPressure: [''],
    heartRateBpm: [null],
    temperatureCelsius: [null],
    respiratoryRateBpm: [null],
    oxygenSaturationPct: [null],
    weightKg: [null],
    heightCm: [null]
  });

  readonly rxForm: FormGroup = this.fb.group({
    specialistId: ['', [Validators.required]],
    prescriptionDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
    notes: [''],
    items: this.fb.array([])
  });

  get rxItems(): FormArray {
    return this.rxForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.patientId.set(id);
      this.loadAllData(id);
    }
  }

  loadAllData(id: string): void {
    forkJoin({
      patient: this.http.get<ApiResponse<PatientDto>>(`${environment.apiUrl}/patients/${id}`),
      appointments: this.http.get<ApiResponse<SchedulingDto[]>>(`${environment.apiUrl}/scheduling?patientId=${id}`),
      records: this.http.get<ApiResponse<MedicalRecordDto[]>>(`${environment.apiUrl}/medical-records?patientId=${id}`),
      prescriptions: this.http.get<ApiResponse<PrescriptionDto[]>>(`${environment.apiUrl}/prescriptions?patientId=${id}`),
      specialists: this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/specialists`)
    }).subscribe({
      next: (res) => {
        this.patient.set(res.patient.data);
        this.appointments.set(res.appointments.data || []);
        this.medicalRecords.set(res.records.data || []);
        this.prescriptions.set(res.prescriptions.data || []);
        this.specialists.set(res.specialists.data || []);

        const loggedSpecialistId = this.authService.specialistId();
        if (loggedSpecialistId) {
          this.recordForm.patchValue({ specialistId: loggedSpecialistId });
          this.rxForm.patchValue({ specialistId: loggedSpecialistId });
        }
      }
    });
  }

  setTab(tab: 'info' | 'appointments' | 'records' | 'prescriptions'): void {
    this.activeTab.set(tab);
  }

  canCreateClinical(): boolean {
    return this.authService.isAdmin() || this.authService.isSpecialist();
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

  openCreateRecordModal(): void {
    this.recordForm.patchValue({
      consultationDate: new Date().toISOString().substring(0, 16),
      reasonForVisit: '',
      diagnosis: '',
      treatmentPlan: '',
      bloodPressure: '',
      heartRateBpm: null,
      temperatureCelsius: null,
      respiratoryRateBpm: null,
      oxygenSaturationPct: null,
      weightKg: null,
      heightCm: null
    });
    this.recordModalOpen.set(true);
  }

  closeRecordModal(): void {
    this.recordModalOpen.set(false);
  }

  saveRecord(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    this.savingRecord.set(true);
    const val = this.recordForm.value;
    const payload = {
      patientId: this.patientId(),
      specialistId: val.specialistId,
      consultationDate: new Date(val.consultationDate).toISOString(),
      reasonForVisit: val.reasonForVisit,
      diagnosis: val.diagnosis,
      treatmentPlan: val.treatmentPlan,
      bloodPressure: val.bloodPressure || null,
      heartRateBpm: val.heartRateBpm ? Number(val.heartRateBpm) : null,
      temperatureCelsius: val.temperatureCelsius ? Number(val.temperatureCelsius) : null,
      respiratoryRateBpm: val.respiratoryRateBpm ? Number(val.respiratoryRateBpm) : null,
      oxygenSaturationPct: val.oxygenSaturationPct ? Number(val.oxygenSaturationPct) : null,
      weightKg: val.weightKg ? Number(val.weightKg) : null,
      heightCm: val.heightCm ? Number(val.heightCm) : null
    };

    this.http.post<ApiResponse<MedicalRecordDto>>(`${environment.apiUrl}/medical-records`, payload).subscribe({
      next: () => {
        this.savingRecord.set(false);
        this.toast.success('Consulta registrada exitosamente.');
        this.closeRecordModal();
        this.loadAllData(this.patientId());
      },
      error: () => this.savingRecord.set(false)
    });
  }

  addRxItem(): void {
    this.rxItems.push(
      this.fb.group({
        medicationName: ['', [Validators.required]],
        dosage: ['', [Validators.required]],
        frequency: ['', [Validators.required]],
        durationDays: [7, [Validators.required, Validators.min(1)]],
        instructions: ['']
      })
    );
  }

  removeRxItem(index: number): void {
    this.rxItems.removeAt(index);
  }

  openCreatePrescriptionModal(): void {
    this.rxItems.clear();
    this.addRxItem();
    this.rxForm.patchValue({
      prescriptionDate: new Date().toISOString().substring(0, 10),
      notes: ''
    });
    this.prescriptionModalOpen.set(true);
  }

  closePrescriptionModal(): void {
    this.prescriptionModalOpen.set(false);
  }

  savePrescription(): void {
    if (this.rxForm.invalid) {
      this.rxForm.markAllAsTouched();
      return;
    }

    this.savingRx.set(true);
    const val = this.rxForm.value;
    const payload = {
      patientId: this.patientId(),
      specialistId: val.specialistId,
      prescriptionDate: new Date(val.prescriptionDate).toISOString(),
      notes: val.notes || null,
      items: val.items
    };

    this.http.post<ApiResponse<PrescriptionDto>>(`${environment.apiUrl}/prescriptions`, payload).subscribe({
      next: () => {
        this.savingRx.set(false);
        this.toast.success('Receta médica emitida exitosamente.');
        this.closePrescriptionModal();
        this.loadAllData(this.patientId());
      },
      error: () => this.savingRx.set(false)
    });
  }

  openPrintModal(rx: PrescriptionDto): void {
    this.selectedRxForPrint.set(rx);
    this.printModalOpen.set(true);
  }

  closePrintModal(): void {
    this.printModalOpen.set(false);
    this.selectedRxForPrint.set(null);
  }

  printDocument(): void {
    window.print();
  }
}
