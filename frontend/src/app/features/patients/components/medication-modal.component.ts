import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrescriptionItemDto } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-medication-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal 
      [isOpen]="isOpen" 
      [title]="isEditing ? 'Editar Medicamento' : 'Agregar Medicamento a la Receta'" 
      subtitle="Especifique el nombre, dosis, frecuencia e instrucciones de administración."
      size="md"
      [zIndex]="60"
      (closed)="close()">
      
      <form [formGroup]="medForm" class="space-y-3">
        <div class="form-group">
          <label class="form-label">Nombre del Medicamento *</label>
          <input 
            type="text" 
            formControlName="medicationName" 
            class="form-control" 
            placeholder="Ej. Amoxicilina 500 mg, Ibuprofeno 400 mg..."
            [class.is-invalid]="isFieldInvalid('medicationName')" />
          @if (isFieldInvalid('medicationName')) {
            <div class="field-error">El nombre del medicamento es obligatorio.</div>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label">Dosis *</label>
            <input 
              type="text" 
              formControlName="dosage" 
              class="form-control" 
              placeholder="Ej. 1 cápsula, 10 ml, 500 mg"
              [class.is-invalid]="isFieldInvalid('dosage')" />
            @if (isFieldInvalid('dosage')) {
              <div class="field-error">La dosis es obligatoria.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Frecuencia *</label>
            <input 
              type="text" 
              formControlName="frequency" 
              class="form-control" 
              placeholder="Ej. Cada 8 horas, Cada 12 horas"
              [class.is-invalid]="isFieldInvalid('frequency')" />
            @if (isFieldInvalid('frequency')) {
              <div class="field-error">La frecuencia es obligatoria.</div>
            }
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Duración del Tratamiento (Días) *</label>
          <input 
            type="number" 
            formControlName="durationDays" 
            class="form-control" 
            min="1" 
            placeholder="Ej. 7"
            [class.is-invalid]="isFieldInvalid('durationDays')" />
          @if (isFieldInvalid('durationDays')) {
            <div class="field-error">La duración debe ser de al menos 1 día.</div>
          }
        </div>

        <div class="form-group">
          <label class="form-label">Instrucciones Adicionales</label>
          <textarea 
            formControlName="instructions" 
            class="form-control" 
            rows="2" 
            placeholder="Ej. Tomar después de las comidas principales con abundante agua."></textarea>
        </div>
      </form>

      <div modal-footer class="flex items-center gap-2">
        <button type="button" class="btn btn-secondary" (click)="close()">Cancelar</button>
        <button type="button" class="btn btn-primary" [disabled]="medForm.invalid" (click)="submit()">
          {{ isEditing ? 'Guardar Cambios' : 'Agregar Medicamento' }}
        </button>
      </div>
    </app-modal>
  `
})
export class MedicationModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() itemToEdit: Partial<PrescriptionItemDto> | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  readonly medForm: FormGroup = this.fb.group({
    medicationName: ['', [Validators.required]],
    dosage: ['', [Validators.required]],
    frequency: ['', [Validators.required]],
    durationDays: [7, [Validators.required, Validators.min(1)]],
    instructions: ['']
  });

  get isEditing(): boolean {
    return !!this.itemToEdit;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (this.itemToEdit) {
        this.medForm.reset({
          medicationName: this.itemToEdit.medicationName || '',
          dosage: this.itemToEdit.dosage || '',
          frequency: this.itemToEdit.frequency || '',
          durationDays: this.itemToEdit.durationDays ?? 7,
          instructions: this.itemToEdit.instructions || ''
        });
      } else {
        this.medForm.reset({
          medicationName: '',
          dosage: '',
          frequency: '',
          durationDays: 7,
          instructions: ''
        });
      }
    }
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.medForm.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.medForm.invalid) {
      this.medForm.markAllAsTouched();
      return;
    }
    this.saved.emit(this.medForm.value);
  }
}
