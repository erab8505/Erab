import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SpecialistDto } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-medical-record-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
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
  `
})
export class MedicalRecordModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() specialists: SpecialistDto[] = [];
  @Input() defaultSpecialistId: string | null = null;
  @Input() saving = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

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
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }
    this.save.emit(this.recordForm.value);
  }
}
