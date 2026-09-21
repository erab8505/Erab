import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateLabParameterDto, LabParameterDto, ParameterValueType, UpdateLabParameterDto } from '../../../core/models/models';
import { LabParameterService } from '../../../core/services/lab-parameter.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-lab-parameter-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="parameter ? 'Editar Parámetro / Analito' : 'Nuevo Parámetro / Analito'"
      size="md"
      (closed)="close()">

      <form (ngSubmit)="save()" class="space-y-3.5 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Código Único *</label>
            <input
              type="text"
              [(ngModel)]="form.code"
              name="code"
              class="form-control font-mono font-bold uppercase text-xs"
              placeholder="Ej. GLU, HB, TRIG, COL-HDL"
              required />
          </div>

          <div>
            <label class="form-label">Tipo de Dato *</label>
            <select [(ngModel)]="form.valueType" name="valueType" class="form-select text-xs font-semibold">
              <option value="Numeric">Numérico (Con Rangos Min/Max)</option>
              <option value="Qualitative">Cualitativo (Positivo/Negativo/Reactivo)</option>
              <option value="TextFree">Texto Libre / Observación</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Nombre del Analito / Parámetro *</label>
          <input
            type="text"
            [(ngModel)]="form.name"
            name="name"
            class="form-control text-xs font-semibold"
            placeholder="Ej. Glucosa en Ayunas, Hemoglobina, Colesterol Total..."
            required />
        </div>

        <div class="grid grid-cols-3 gap-2.5">
          <div>
            <label class="form-label">Unidad de Medida</label>
            <input
              type="text"
              [(ngModel)]="form.unit"
              name="unit"
              class="form-control font-mono text-xs"
              placeholder="Ej. mg/dL, g/dL, %" />
          </div>

          @if (form.valueType === 'Numeric') {
            <div>
              <label class="form-label">Rango Mínimo</label>
              <input
                type="number"
                step="any"
                [(ngModel)]="form.defaultReferenceMin"
                name="defaultReferenceMin"
                class="form-control font-mono text-xs"
                placeholder="70.0" />
            </div>

            <div>
              <label class="form-label">Rango Máximo</label>
              <input
                type="number"
                step="any"
                [(ngModel)]="form.defaultReferenceMax"
                name="defaultReferenceMax"
                class="form-control font-mono text-xs"
                placeholder="100.0" />
            </div>
          }
        </div>

        <div>
          <label class="form-label">Texto de Referencia / Interpretación por Defecto</label>
          <input
            type="text"
            [(ngModel)]="form.defaultReferenceText"
            name="defaultReferenceText"
            class="form-control text-xs"
            placeholder="Ej. Normal: 70 - 100 mg/dL, No Reactivo, Negativo..." />
        </div>

        <div class="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2.5">
          <div>
            <label class="form-label">Reactivo Utilizado (Opcional)</label>
            <input
              type="text"
              [(ngModel)]="form.defaultReagentName"
              name="defaultReagentName"
              class="form-control text-xs"
              placeholder="Ej. Kit Glucosa GOD-PAP" />
          </div>

          <div>
            <label class="form-label">Gasto Estimado (mL/U)</label>
            <input
              type="number"
              step="any"
              [(ngModel)]="form.defaultReagentQuantity"
              name="defaultReagentQuantity"
              class="form-control font-mono text-xs"
              placeholder="1.0" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" class="btn btn-secondary" (click)="close()">Cancelar</button>
          <button type="submit" class="btn btn-primary font-bold" [disabled]="saving || !form.code || !form.name">
            @if (saving) {
              <span class="spinner-sm mr-1.5"></span>
            }
            {{ parameter ? 'Actualizar Parámetro' : 'Crear Parámetro' }}
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class LabParameterModalComponent implements OnChanges {
  private readonly parameterService = inject(LabParameterService);
  private readonly toast = inject(ToastService);

  @Input() isOpen = false;
  @Input() parameter: LabParameterDto | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<LabParameterDto>();

  saving = false;

  form: CreateLabParameterDto = {
    code: '',
    name: '',
    description: '',
    unit: '',
    valueType: 'Numeric',
    defaultReferenceMin: null,
    defaultReferenceMax: null,
    defaultReferenceText: '',
    defaultReagentName: '',
    defaultReagentQuantity: null
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (this.parameter) {
        this.form = {
          code: this.parameter.code,
          name: this.parameter.name,
          description: this.parameter.description || '',
          unit: this.parameter.unit || '',
          valueType: this.parameter.valueType,
          defaultReferenceMin: this.parameter.defaultReferenceMin,
          defaultReferenceMax: this.parameter.defaultReferenceMax,
          defaultReferenceText: this.parameter.defaultReferenceText || '',
          defaultReagentName: this.parameter.defaultReagentName || '',
          defaultReagentQuantity: this.parameter.defaultReagentQuantity
        };
      } else {
        this.form = {
          code: '',
          name: '',
          description: '',
          unit: '',
          valueType: 'Numeric',
          defaultReferenceMin: null,
          defaultReferenceMax: null,
          defaultReferenceText: '',
          defaultReagentName: '',
          defaultReagentQuantity: null
        };
      }
    }
  }

  save(): void {
    if (!this.form.code.trim() || !this.form.name.trim()) {
      this.toast.error('Código y nombre son requeridos.');
      return;
    }

    this.saving = true;

    if (this.parameter) {
      const updateDto: UpdateLabParameterDto = {
        ...this.form,
        isActive: this.parameter.isActive
      };

      this.parameterService.update(this.parameter.id, updateDto).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success && res.data) {
            this.toast.success('Parámetro actualizado exitosamente.');
            this.saved.emit(res.data);
            this.close();
          } else {
            this.toast.error(res.message || 'Error al actualizar parámetro.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Error al guardar parámetro.');
        }
      });
    } else {
      this.parameterService.create(this.form).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success && res.data) {
            this.toast.success('Parámetro creado exitosamente.');
            this.saved.emit(res.data);
            this.close();
          } else {
            this.toast.error(res.message || 'Error al crear parámetro.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Error al crear parámetro.');
        }
      });
    }
  }

  close(): void {
    this.closed.emit();
  }
}
