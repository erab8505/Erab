import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDto } from '../../../core/models/models';

@Component({
  selector: 'app-patient-info-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card p-5">
        <h2 class="text-base font-semibold mb-3 border-b pb-2 text-slate-900 dark:text-slate-100">Información Demográfica</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-500 font-medium">Documento de Identidad:</span>
            <span class="doc-pill">
              🆔 {{ patient?.documentId }}
            </span>
          </div>
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-500 font-medium">Nombre Completo:</span>
            <span class="font-semibold text-slate-900 dark:text-slate-100">
              {{ patient?.fullName || (patient?.firstName ? (patient?.firstName + ' ' + patient?.lastName) : '-') }}
            </span>
          </div>
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-500 font-medium">Fecha de Nacimiento:</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ (patient?.dateOfBirth || patient?.birthDate) | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-500 font-medium">Edad Calculada:</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ patient?.age }} años</span>
          </div>
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-500 font-medium">Género:</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">
              {{ patient?.gender === 'M' ? 'Masculino' : patient?.gender === 'F' ? 'Femenino' : 'Otro' }}
            </span>
          </div>
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-500 font-medium">Grupo Sanguíneo (RH):</span>
            <span class="font-semibold text-rose-600 dark:text-rose-400">{{ patient?.bloodType || 'No registrado' }}</span>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h2 class="text-base font-semibold mb-3 border-b pb-2">Contacto y Antecedentes</h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-500">Teléfono:</span>
            <span class="font-medium">{{ patient?.phone || 'Sin registrar' }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-500">Correo Electrónico:</span>
            <span class="font-medium">{{ patient?.email || 'Sin registrar' }}</span>
          </div>
          <div class="pt-2">
            <span class="text-slate-500 block mb-1 font-medium">Alergias y Condiciones Especiales:</span>
            <div class="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded text-rose-800 dark:text-rose-300">
              {{ patient?.allergies || 'Sin alergias registradas.' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PatientInfoTabComponent {
  @Input() patient: PatientDto | null = null;
}
