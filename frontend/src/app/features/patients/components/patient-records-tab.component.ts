import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalRecordDto } from '../../../core/models/models';

@Component({
  selector: 'app-patient-records-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold m-0">Historia Clínica y Consultas Médicas</h2>
        @if (canCreate) {
          <button type="button" class="btn btn-primary btn-sm" (click)="openCreateRecord.emit()">
            + Registrar Consulta / Evolución
          </button>
        }
      </div>

      @if (medicalRecords.length === 0) {
        <div class="card p-8 text-center text-slate-400">
          <p>No hay notas clínicas registradas para este paciente.</p>
        </div>
      } @else {
        @for (rec of medicalRecords; track rec.id) {
          <div class="card p-5 space-y-4 border border-slate-200 dark:border-slate-800">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <span class="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🗓️ Atención: {{ rec.recordDate | date:'dd/MM/yyyy HH:mm' }}
                  @if (rec.interventionTypeName) {
                    <span class="text-xs bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-md font-semibold border border-sky-300 dark:border-sky-700">
                      🩺 {{ rec.interventionTypeName }}
                    </span>
                  }
                </span>
              </div>
            </div>

            <!-- Vital Signs Bar -->
            @if (hasVitalSigns(rec)) {
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs border border-slate-100 dark:border-slate-800">
                <div><span class="text-slate-400 block font-medium">P. Arterial:</span> <b class="text-slate-700 dark:text-slate-200">{{ formatBP(rec) }}</b></div>
                <div><span class="text-slate-400 block font-medium">Pulso:</span> <b class="text-slate-700 dark:text-slate-200">{{ rec.heartRateBpm ? rec.heartRateBpm + ' lpm' : '-' }}</b></div>
                <div><span class="text-slate-400 block font-medium">Temp:</span> <b class="text-slate-700 dark:text-slate-200">{{ rec.temperatureCelsius ? rec.temperatureCelsius + ' °C' : '-' }}</b></div>
                <div><span class="text-slate-400 block font-medium">Sat O2:</span> <b class="text-slate-700 dark:text-slate-200">{{ rec.oxygenSaturation ? rec.oxygenSaturation + ' %' : '-' }}</b></div>
                <div><span class="text-slate-400 block font-medium">Peso:</span> <b class="text-slate-700 dark:text-slate-200">{{ rec.weightKg ? rec.weightKg + ' kg' : '-' }}</b></div>
                <div><span class="text-slate-400 block font-medium">Talla:</span> <b class="text-slate-700 dark:text-slate-200">{{ rec.heightCm ? rec.heightCm + ' cm' : '-' }}</b></div>
              </div>
            }

            <div class="space-y-3 text-sm">
              <div>
                <span class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Diagnóstico:</span>
                <p class="m-0 font-medium text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900">
                  {{ rec.diagnosis }}
                </p>
              </div>

              @if (rec.treatment) {
                <div>
                  <span class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Plan de Tratamiento / Procedimiento:</span>
                  <p class="m-0 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
                    {{ rec.treatment }}
                  </p>
                </div>
              }

              @if (rec.notes) {
                <div>
                  <span class="font-bold text-slate-700 dark:text-slate-300 block mb-1">Notas de Evolución:</span>
                  <p class="m-0 text-slate-600 dark:text-slate-300 italic">
                    {{ rec.notes }}
                  </p>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `
})
export class PatientRecordsTabComponent {
  @Input() medicalRecords: MedicalRecordDto[] = [];
  @Input() canCreate = false;

  @Output() openCreateRecord = new EventEmitter<void>();

  hasVitalSigns(rec: MedicalRecordDto): boolean {
    return !!(rec.systolicBP || rec.diastolicBP || rec.heartRateBpm || rec.temperatureCelsius || rec.oxygenSaturation || rec.weightKg || rec.heightCm);
  }

  formatBP(rec: MedicalRecordDto): string {
    if (rec.systolicBP && rec.diastolicBP) {
      return `${rec.systolicBP}/${rec.diastolicBP} mmHg`;
    }
    if (rec.systolicBP) return `${rec.systolicBP} mmHg`;
    return '-';
  }
}
