import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, SpecialistAvailabilityDto, SpecialistDto } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';

interface DayConfig {
  index: number;
  name: string;
}

@Component({
  selector: 'app-specialist-availability',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <a routerLink="/specialists" class="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              &larr; Volver a Especialistas
            </a>
          </div>
          <h1 class="text-2xl font-bold">
            Disponibilidad Semanal: 
            <span class="text-blue-600 dark:text-blue-400">{{ specialist()?.fullName || 'Cargando...' }}</span>
          </h1>
          <p class="text-slate-500 text-sm">
            Especialidad: <b>{{ specialist()?.specialtyName }}</b> | Licencia: <b>{{ specialist()?.licenseNumber }}</b>
          </p>
        </div>
      </div>

      <!-- Add Interval Card -->
      <div class="card p-5">
        <h2 class="text-base font-semibold mb-3">Agregar Turno / Intervalo de Atención</h2>
        <form [formGroup]="form" (ngSubmit)="addAvailability()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div class="form-group mb-0">
            <label class="form-label">Día de la Semana *</label>
            <select formControlName="dayOfWeek" class="form-select">
              @for (d of days; track d.index) {
                <option [value]="d.index">{{ d.name }}</option>
              }
            </select>
          </div>

          <div class="form-group mb-0">
            <label class="form-label">Hora Inicio *</label>
            <input type="time" formControlName="startHour" class="form-control" />
          </div>

          <div class="form-group mb-0">
            <label class="form-label">Hora Fin *</label>
            <input type="time" formControlName="endHour" class="form-control" />
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
            @if (saving()) {
              <span class="spinner-sm mr-1.5"></span>
            }
            Agregar Horario
          </button>
        </form>
      </div>

      <!-- 7-Day Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mt-4">
        @for (d of days; track d.index) {
          <div class="day-column card p-3">
            <div class="day-header pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
              <span class="day-name font-semibold text-sm">{{ d.name }}</span>
              <span class="day-count text-xs text-slate-500">({{ getIntervalsForDay(d.index).length }} turnos)</span>
            </div>

            <div class="intervals-list flex flex-col gap-2">
              @if (getIntervalsForDay(d.index).length === 0) {
                <span class="text-xs text-slate-400 italic py-4 text-center">Sin turnos</span>
              } @else {
                @for (item of getIntervalsForDay(d.index); track item.id) {
                  <div class="interval-chip">
                    <div class="interval-time">
                      <span>{{ formatTime(item.startHour) }} - {{ formatTime(item.endHour) }}</span>
                    </div>
                    <button 
                      type="button" 
                      class="delete-interval-btn" 
                      title="Eliminar turno" 
                      (click)="deleteAvailability(item.id)">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .day-column { min-height: 160px; display: flex; flex-direction: column; }
    @media (min-width: 1280px) {
      .day-column { min-height: 280px; }
    }
    .day-header { display: flex; align-items: center; justify-content: space-between; }
    .interval-chip {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 0.375rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    :host-context(.dark) .interval-chip {
      background: rgba(30, 64, 175, 0.2);
      border-color: #1e40af;
      color: #93c5fd;
    }
    .delete-interval-btn {
      background: transparent;
      border: none;
      color: #ef4444;
      cursor: pointer;
      padding: 0.125rem;
      display: flex;
      align-items: center;
      border-radius: 0.25rem;
    }
    .delete-interval-btn:hover { background-color: #fee2e2; }
    :host-context(.dark) .delete-interval-btn:hover { background-color: rgba(239, 68, 68, 0.2); }
  `]
})
export class SpecialistAvailabilityComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly specialistId = signal<string>('');
  readonly specialist = signal<SpecialistDto | null>(null);
  readonly availabilities = signal<SpecialistAvailabilityDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);

  readonly days: DayConfig[] = [
    { index: 1, name: 'Lunes' },
    { index: 2, name: 'Martes' },
    { index: 3, name: 'Miércoles' },
    { index: 4, name: 'Jueves' },
    { index: 5, name: 'Viernes' },
    { index: 6, name: 'Sábado' },
    { index: 0, name: 'Domingo' }
  ];

  readonly form: FormGroup = this.fb.group({
    dayOfWeek: [1, [Validators.required]],
    startHour: ['08:00', [Validators.required]],
    endHour: ['12:00', [Validators.required]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.specialistId.set(id);
      this.loadData(id);
    }
  }

  loadData(id: string): void {
    this.loading.set(true);
    forkJoin({
      specialist: this.http.get<ApiResponse<SpecialistDto>>(`${environment.apiUrl}/specialists/${id}`),
      availabilities: this.http.get<ApiResponse<SpecialistAvailabilityDto[]>>(`${environment.apiUrl}/specialists/${id}/availability`)
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.specialist.set(res.specialist.data);
        this.availabilities.set(res.availabilities.data || []);
      },
      error: () => this.loading.set(false)
    });
  }

  getIntervalsForDay(dayIndex: number): SpecialistAvailabilityDto[] {
    return this.availabilities().filter(a => a.dayOfWeek === dayIndex);
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // "08:00:00" -> "08:00"
  }

  addAvailability(): void {
    if (this.form.invalid) return;

    const val = this.form.value;
    if (val.startHour >= val.endHour) {
      this.toast.error('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    this.saving.set(true);
    const payload = {
      specialistId: this.specialistId(),
      dayOfWeek: Number(val.dayOfWeek),
      startHour: `${val.startHour}:00`,
      endHour: `${val.endHour}:00`
    };

    this.http.post<ApiResponse<SpecialistAvailabilityDto>>(`${environment.apiUrl}/specialist-availability`, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Horario agregado exitosamente.');
        this.loadData(this.specialistId());
      },
      error: () => this.saving.set(false)
    });
  }

  deleteAvailability(id: string): void {
    this.http.delete<ApiResponse>(`${environment.apiUrl}/specialist-availability/${id}`).subscribe({
      next: () => {
        this.toast.info('Horario eliminado.');
        this.loadData(this.specialistId());
      }
    });
  }
}
