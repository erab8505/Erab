import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrescriptionDto } from '../../../core/models/models';

@Component({
  selector: 'app-patient-prescriptions-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold m-0">Fórmulas Médicas Emitidas</h2>
        @if (canCreate) {
          <button type="button" class="btn btn-primary btn-sm" (click)="openCreatePrescription.emit()">
            + Emitir Nueva Receta
          </button>
        }
      </div>

      @if (prescriptions.length === 0) {
        <div class="card p-8 text-center text-slate-400">
          <p>No se han emitido fórmulas médicas para este paciente.</p>
        </div>
      } @else {
        @for (rx of prescriptions; track rx.id) {
          <div class="card p-5 space-y-3">
            <div class="flex items-center justify-between border-b pb-3">
              <div>
                <span class="font-bold text-slate-900 dark:text-slate-100">
                  Receta Médica - {{ rx.prescriptionDate | date:'dd/MM/yyyy' }}
                </span>
                <span class="text-slate-500 text-xs block">
                  Prescrito por: 👨‍⚕️ <b>{{ rx.specialistName }}</b>
                </span>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" (click)="openPrint.emit(rx)">
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
  `
})
export class PatientPrescriptionsTabComponent {
  @Input() prescriptions: PrescriptionDto[] = [];
  @Input() canCreate = false;

  @Output() openCreatePrescription = new EventEmitter<void>();
  @Output() openPrint = new EventEmitter<PrescriptionDto>();
}
