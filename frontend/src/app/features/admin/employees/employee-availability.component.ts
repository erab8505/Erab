import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EmployeeAvailabilityDto, EmployeeDto } from '../../../core/models/models';
import { EmployeeService } from '../../../core/services/employee.service';
import { ToastService } from '../../../core/services/toast.service';

interface DayConfig {
  index: number;
  name: string;
}

@Component({
  selector: 'app-employee-availability',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <a routerLink="/employees" class="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              &larr; Volver a Directorio de Empleados
            </a>
          </div>
          <h1 class="text-2xl font-bold">
            Disponibilidad Semanal: 
            <span class="text-blue-600 dark:text-blue-400">{{ employee()?.fullName || 'Cargando...' }}</span>
          </h1>
          <p class="text-slate-500 text-sm">
            Puesto: <b>{{ employee()?.jobTitle || 'Empleado' }}</b>
            @if (employee()?.specialtyName) {
              | Especialidad: <b>{{ employee()?.specialtyName }}</b>
            }
            @if (employee()?.licenseNumber) {
              | Licencia: <b>{{ employee()?.licenseNumber }}</b>
            }
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
  `]
})
export class EmployeeAvailabilityComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly employeeId = signal<string>('');
  readonly employee = signal<EmployeeDto | null>(null);
  readonly availabilities = signal<EmployeeAvailabilityDto[]>([]);
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

  form: FormGroup = this.fb.group({
    dayOfWeek: [1, [Validators.required]],
    startHour: ['08:00', [Validators.required]],
    endHour: ['12:00', [Validators.required]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId.set(id);
      this.loadData(id);
    }
  }

  loadData(id: string): void {
    this.loading.set(true);
    forkJoin({
      employee: this.employeeService.getEmployeeById(id),
      availabilities: this.employeeService.getAvailability(id)
    }).subscribe({
      next: ({ employee, availabilities }) => {
        this.employee.set(employee.data);
        this.availabilities.set(availabilities.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la disponibilidad del empleado.');
        this.loading.set(false);
      }
    });
  }

  getIntervalsForDay(dayIndex: number): EmployeeAvailabilityDto[] {
    return this.availabilities().filter(a => a.dayOfWeek === dayIndex);
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  }

  addAvailability(): void {
    if (this.form.invalid) return;

    const val = this.form.value;
    if (val.startHour >= val.endHour) {
      this.toast.error('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    this.saving.set(true);
    this.employeeService.setAvailability(this.employeeId(), {
      dayOfWeek: Number(val.dayOfWeek),
      startHour: val.startHour + ':00',
      endHour: val.endHour + ':00'
    }).subscribe({
      next: () => {
        this.toast.success('Horario guardado correctamente.');
        this.saving.set(false);
        this.loadData(this.employeeId());
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al guardar el horario.');
        this.saving.set(false);
      }
    });
  }
}
