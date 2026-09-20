import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SpecialistDto } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { MedicationModalComponent } from './medication-modal.component';

@Component({
  selector: 'app-prescription-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, MedicationModalComponent],
  template: `
    <app-modal 
      [isOpen]="isOpen" 
      title="Emitir Receta Médica" 
      size="xl"
      (closed)="close()">
      
      <form [formGroup]="rxForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label">Médico Prescriptor *</label>
            <select formControlName="specialistId" class="form-select">
              <option value="" disabled>Seleccione especialista...</option>
              @for (doc of specialists; track doc.id) {
                <option [value]="doc.id">{{ doc.fullName }} ({{ doc.specialtyName }})</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Fecha de Prescripción *</label>
            <input type="date" formControlName="prescriptionDate" class="form-control" />
          </div>
        </div>

        <!-- Items List Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <label class="form-label m-0">Medicamentos Prescritos ({{ rxItems.length }}) *</label>
              <p class="text-xs text-slate-500 m-0">Añada los fármacos, dosis y pautas para esta prescripción.</p>
            </div>
            <button type="button" class="btn btn-primary btn-sm flex items-center gap-1" (click)="openAddMedication()">
              <span>+ Agregar Medicamento</span>
            </button>
          </div>

          @if (rxItems.length === 0) {
            <div class="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center bg-slate-50 dark:bg-slate-800/40 space-y-2">
              <span class="text-3xl block">💊</span>
              <p class="text-sm font-bold text-slate-800 dark:text-slate-200 m-0">No has agregado ningún medicamento a esta receta.</p>
              <p class="text-xs text-slate-600 dark:text-slate-400 m-0">Añada los fármacos requeridos para el tratamiento del paciente.</p>
              <button type="button" class="btn btn-secondary font-semibold btn-sm mt-2" (click)="openAddMedication()">
                + Agregar Primer Medicamento
              </button>
            </div>
          } @else {
            <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th class="p-2.5">Medicamento</th>
                    <th class="p-2.5">Dosis</th>
                    <th class="p-2.5">Frecuencia</th>
                    <th class="p-2.5">Duración</th>
                    <th class="p-2.5">Instrucciones</th>
                    <th class="p-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  @for (item of rxItems.controls; track $index; let i = $index) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td class="p-2.5 font-bold text-slate-900 dark:text-slate-100">{{ item.value.medicationName }}</td>
                      <td class="p-2.5 text-slate-800 dark:text-slate-200">{{ item.value.dosage }}</td>
                      <td class="p-2.5 text-slate-800 dark:text-slate-200">{{ item.value.frequency }}</td>
                      <td class="p-2.5 text-slate-800 dark:text-slate-200">{{ item.value.durationDays }} días</td>
                      <td class="p-2.5 text-slate-700 dark:text-slate-300">{{ item.value.instructions || '-' }}</td>
                      <td class="p-2.5 text-right space-x-1 whitespace-nowrap">
                        <button type="button" class="btn btn-secondary btn-sm p-1.5" title="Editar medicamento" (click)="openEditMedication(i)">
                          ✏️
                        </button>
                        <button type="button" class="btn btn-danger btn-sm p-1.5" title="Eliminar medicamento" (click)="removeRxItem(i)">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <div class="form-group">
          <label class="form-label">Notas Generales / Indicaciones de la Receta</label>
          <textarea formControlName="notes" class="form-control" rows="2" placeholder="Recomendaciones generales no farmacológicas..."></textarea>
        </div>
      </form>

      <div modal-footer class="flex items-center gap-2">
        <button type="button" class="btn btn-secondary" (click)="close()">Cancelar</button>
        <button type="button" class="btn btn-primary" [disabled]="rxForm.invalid || rxItems.length === 0 || saving" (click)="submit()">
          @if (saving) {
            <span class="spinner-sm mr-1.5"></span>
          }
          Emitir Receta
        </button>
      </div>
    </app-modal>

    <!-- Sub-modal for adding/editing medication -->
    <app-medication-modal 
      [isOpen]="medModalOpen()"
      [itemToEdit]="itemToEdit()"
      (closed)="closeMedModal()"
      (saved)="onMedicationSaved($event)">
    </app-medication-modal>
  `
})
export class PrescriptionModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  @Input() isOpen = false;
  @Input() specialists: SpecialistDto[] = [];
  @Input() defaultSpecialistId: string | null = null;
  @Input() saving = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  readonly rxForm: FormGroup = this.fb.group({
    specialistId: ['', [Validators.required]],
    prescriptionDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
    notes: [''],
    items: this.fb.array([])
  });

  readonly medModalOpen = signal<boolean>(false);
  readonly editingIndex = signal<number | null>(null);
  readonly itemToEdit = signal<any | null>(null);

  get rxItems(): FormArray {
    return this.rxForm.get('items') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.rxItems.clear();
    this.rxForm.reset({
      specialistId: this.defaultSpecialistId || (this.specialists.length > 0 ? this.specialists[0].id : ''),
      prescriptionDate: new Date().toISOString().substring(0, 10),
      notes: ''
    });
  }

  openAddMedication(): void {
    this.editingIndex.set(null);
    this.itemToEdit.set(null);
    this.medModalOpen.set(true);
  }

  openEditMedication(index: number): void {
    this.editingIndex.set(index);
    this.itemToEdit.set(this.rxItems.at(index).value);
    this.medModalOpen.set(true);
  }

  closeMedModal(): void {
    this.medModalOpen.set(false);
    this.editingIndex.set(null);
    this.itemToEdit.set(null);
  }

  onMedicationSaved(val: any): void {
    const editIdx = this.editingIndex();
    if (editIdx !== null && editIdx >= 0) {
      this.rxItems.at(editIdx).patchValue({
        medicationName: val.medicationName,
        dosage: val.dosage,
        frequency: val.frequency,
        durationDays: Number(val.durationDays),
        instructions: val.instructions || ''
      });
      this.toast.info('Medicamento actualizado.');
    } else {
      this.rxItems.push(
        this.fb.group({
          medicationName: [val.medicationName, [Validators.required]],
          dosage: [val.dosage, [Validators.required]],
          frequency: [val.frequency, [Validators.required]],
          durationDays: [Number(val.durationDays), [Validators.required, Validators.min(1)]],
          instructions: [val.instructions || '']
        })
      );
      this.toast.info('Medicamento agregado a la receta.');
    }
    this.closeMedModal();
  }

  removeRxItem(index: number): void {
    this.rxItems.removeAt(index);
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.rxForm.invalid) {
      this.rxForm.markAllAsTouched();
      return;
    }

    if (this.rxItems.length === 0) {
      this.toast.warning('Debe agregar al menos un medicamento a la receta.');
      return;
    }

    this.save.emit(this.rxForm.value);
  }
}
