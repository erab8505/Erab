import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatePrescriptionItemDto, PrescriptionItemDto, SpecialistDto } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { MedicationModalComponent } from './medication-modal.component';

@Component({
  selector: 'app-medical-record-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent, MedicationModalComponent],
  template: `
    <app-modal 
      [isOpen]="isOpen" 
      title="Registrar Consulta / Atención Médica" 
      size="lg"
      (closed)="close()">
      
      <form [formGroup]="recordForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label">Fecha / Hora de Atención *</label>
            <input type="datetime-local" formControlName="recordDate" class="form-control" />
          </div>

          <div class="form-group">
            <label class="form-label">Especialista Responsable</label>
            <select formControlName="specialistId" class="form-select">
              <option value="" disabled>Seleccione especialista...</option>
              @for (doc of specialists; track doc.id) {
                <option [value]="doc.id">{{ doc.fullName }} ({{ doc.specialtyName }})</option>
              }
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label font-semibold text-slate-900 dark:text-slate-100">Diagnóstico Clínico *</label>
          <input type="text" formControlName="diagnosis" class="form-control font-medium" placeholder="Ej. Pulpitis irreversible sintomática / Caries oclusal..." />
          @if (recordForm.get('diagnosis')?.touched && recordForm.get('diagnosis')?.hasError('required')) {
            <span class="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 block">El diagnóstico es obligatorio.</span>
          }
        </div>

        <div class="form-group">
          <label class="form-label font-semibold text-slate-900 dark:text-slate-100">Plan de Tratamiento y Procedimientos Realizados</label>
          <textarea formControlName="treatment" class="form-control" rows="2" placeholder="Detalle del procedimiento clínico ejecutado, medicación aplicada, etc."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label font-semibold text-slate-900 dark:text-slate-100">Notas de Evolución y Recomendaciones</label>
          <textarea formControlName="notes" class="form-control" rows="2" placeholder="Observaciones del paciente, recomendaciones e indicaciones generales..."></textarea>
        </div>

        <!-- Signos Vitales y Antropometría -->
        <div class="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <span class="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">Signos Vitales y Antropometría</span>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5">
            <div>
              <label class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">P. Sistólica</label>
              <input type="number" formControlName="systolicBP" class="form-control text-xs p-1.5 font-medium" placeholder="120" min="30" max="300" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">P. Diastólica</label>
              <input type="number" formControlName="diastolicBP" class="form-control text-xs p-1.5 font-medium" placeholder="80" min="20" max="200" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Pulso (lpm)</label>
              <input type="number" formControlName="heartRateBpm" class="form-control text-xs p-1.5 font-medium" placeholder="72" min="20" max="300" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Temp (°C)</label>
              <input type="number" step="0.1" formControlName="temperatureCelsius" class="form-control text-xs p-1.5 font-medium" placeholder="36.5" min="25" max="45" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Sat O2 (%)</label>
              <input type="number" formControlName="oxygenSaturation" class="form-control text-xs p-1.5 font-medium" placeholder="98" min="50" max="100" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Peso (kg)</label>
              <input type="number" step="0.1" formControlName="weightKg" class="form-control text-xs p-1.5 font-medium" placeholder="70" min="0.1" max="500" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Talla (cm)</label>
              <input type="number" step="0.1" formControlName="heightCm" class="form-control text-xs p-1.5 font-medium" placeholder="170" min="10" max="300" />
            </div>
          </div>
        </div>

        <!-- TARJETA ENLACE A SUBMODAL DE RECETA MÉDICA -->
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

      <div modal-footer class="flex items-center gap-2">
        <button type="button" class="btn btn-secondary font-medium" (click)="close()">Cancelar</button>
        <button type="button" class="btn btn-primary font-semibold" [disabled]="recordForm.invalid || saving" (click)="submit()">
          @if (saving) {
            <span class="spinner-sm mr-1.5"></span>
          }
          Guardar Atención Clínica
        </button>
      </div>
    </app-modal>

    <!-- SUBMODAL 2: EMITIR RECETA / FÓRMULA MÉDICA -->
    <app-modal
      [isOpen]="prescriptionSubModalOpen()"
      title="Emitir Receta / Fórmula Médica"
      size="lg"
      [zIndex]="70"
      (closed)="closePrescriptionModal()">
      
      <div class="space-y-4">
        @if (patientName) {
          <div class="rx-modal-patient-card">
            <div>
              <span class="rx-patient-name">Paciente: {{ patientName }}</span>
              <span class="rx-patient-doc">Doc: {{ patientDocument || 'N/A' }}</span>
            </div>
            <div class="text-right">
              <span class="rx-specialist-name">👨‍⚕️ {{ getSelectedSpecialistName() }}</span>
              <span class="rx-procedure-name">Consulta Médica</span>
            </div>
          </div>
        }

        <div class="rx-section-header">
          <span class="rx-section-title">Medicamentos Formulados ({{ pendingPrescriptionItems().length }})</span>
          <button 
            type="button" 
            class="btn btn-primary btn-sm font-semibold" 
            (click)="openAddMedication()">
            + Agregar Medicamento
          </button>
        </div>

        @if (pendingPrescriptionItems().length === 0) {
          <div class="rx-empty-box">
            <span class="rx-empty-icon">💊</span>
            <p class="rx-empty-title">Aún no hay medicamentos en esta receta.</p>
            <p class="rx-empty-subtitle">Haga clic a continuación para añadir fármacos con sus dosis, frecuencia y duración.</p>
            <button type="button" class="btn btn-primary btn-sm mt-2" (click)="openAddMedication()">
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
                <div class="flex items-center gap-1">
                  <button 
                    type="button" 
                    class="btn btn-secondary btn-sm p-1.5" 
                    title="Editar medicamento"
                    (click)="openEditMedication(idx)">
                    ✏️
                  </button>
                  <button 
                    type="button" 
                    class="rx-item-delete-btn" 
                    title="Eliminar medicamento"
                    (click)="removePrescriptionItem(idx)">
                    🗑️
                  </button>
                </div>
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

    <!-- SUBMODAL 3: AGREGAR / EDITAR MEDICAMENTO INDIVIDUAL -->
    <app-medication-modal
      [isOpen]="medicationModalOpen()"
      [itemToEdit]="itemToEdit()"
      [zIndex]="90"
      (closed)="closeMedicationModal()"
      (saved)="saveMedication($event)">
    </app-medication-modal>
  `
})
export class MedicalRecordModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() specialists: SpecialistDto[] = [];
  @Input() defaultSpecialistId: string | null = null;
  @Input() saving = false;
  @Input() patientName = '';
  @Input() patientDocument = '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  readonly pendingPrescriptionItems = signal<CreatePrescriptionItemDto[]>([]);
  readonly prescriptionNotes = signal<string>('');
  readonly prescriptionSubModalOpen = signal<boolean>(false);
  readonly medicationModalOpen = signal<boolean>(false);
  readonly editingMedIndex = signal<number | null>(null);
  readonly itemToEdit = signal<Partial<PrescriptionItemDto> | null>(null);

  readonly recordForm: FormGroup = this.fb.group({
    specialistId: [''],
    recordDate: [new Date().toISOString().substring(0, 16), [Validators.required]],
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.recordForm.reset({
      specialistId: this.defaultSpecialistId || (this.specialists.length > 0 ? this.specialists[0].id : ''),
      recordDate: new Date().toISOString().substring(0, 16),
      diagnosis: '',
      treatment: '',
      notes: '',
      systolicBP: null,
      diastolicBP: null,
      heartRateBpm: null,
      temperatureCelsius: null,
      oxygenSaturation: null,
      weightKg: null,
      heightCm: null
    });
    this.clearPrescription();
    this.prescriptionSubModalOpen.set(false);
    this.medicationModalOpen.set(false);
  }

  getSelectedSpecialistName(): string {
    const specId = this.recordForm.get('specialistId')?.value;
    const found = this.specialists.find(s => s.id === specId);
    return found ? found.fullName : 'Especialista';
  }

  openPrescriptionModal(): void {
    this.prescriptionSubModalOpen.set(true);
  }

  closePrescriptionModal(): void {
    this.prescriptionSubModalOpen.set(false);
  }

  clearPrescription(): void {
    this.pendingPrescriptionItems.set([]);
    this.prescriptionNotes.set('');
  }

  openAddMedication(): void {
    this.editingMedIndex.set(null);
    this.itemToEdit.set(null);
    this.medicationModalOpen.set(true);
  }

  openEditMedication(index: number): void {
    const item = this.pendingPrescriptionItems()[index];
    if (!item) return;
    this.editingMedIndex.set(index);
    this.itemToEdit.set({
      medicationName: item.medicationName,
      dosage: item.dosage,
      frequency: item.frequency,
      durationDays: item.durationDays,
      instructions: item.instructions || ''
    });
    this.medicationModalOpen.set(true);
  }

  closeMedicationModal(): void {
    this.medicationModalOpen.set(false);
    this.itemToEdit.set(null);
    this.editingMedIndex.set(null);
  }

  saveMedication(item: any): void {
    const medItem: CreatePrescriptionItemDto = {
      medicationName: item.medicationName,
      dosage: item.dosage,
      frequency: item.frequency,
      durationDays: Number(item.durationDays),
      instructions: item.instructions || null
    };

    const current = [...this.pendingPrescriptionItems()];
    const editIdx = this.editingMedIndex();

    if (editIdx !== null && editIdx >= 0 && editIdx < current.length) {
      current[editIdx] = medItem;
    } else {
      current.push(medItem);
    }

    this.pendingPrescriptionItems.set(current);
    this.closeMedicationModal();
  }

  removePrescriptionItem(index: number): void {
    const current = this.pendingPrescriptionItems().filter((_, i) => i !== index);
    this.pendingPrescriptionItems.set(current);
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.recordForm.value };
    const items = this.pendingPrescriptionItems();

    const prescriptionPayload = items.length > 0 ? {
      specialistId: payload.specialistId || this.defaultSpecialistId,
      prescriptionDate: new Date().toISOString(),
      notes: this.prescriptionNotes() || null,
      items: items
    } : null;

    this.save.emit({
      record: payload,
      prescription: prescriptionPayload
    });
  }
}
