import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SchedulingDto } from '../../../core/models/models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-patient-appointments-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent],
  template: `
    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold m-0">Historial de Citas Médicas</h2>
        <a [routerLink]="['/scheduling/new']" [queryParams]="{ patientId: patientId }" class="btn btn-primary btn-sm">
          + Nueva Cita
        </a>
      </div>

      @if (appointments.length === 0) {
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
              @for (app of appointments; track app.id) {
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
  `
})
export class PatientAppointmentsTabComponent {
  @Input() appointments: SchedulingDto[] = [];
  @Input() patientId: string = '';

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
}
