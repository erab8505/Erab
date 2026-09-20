import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AreaDto, InterventionTypeDto, PatientDto, SchedulingDto, SpecialistDto, SpecialtyDto, TimeSlotDto } from '../../core/models/models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wizard-container">
      <div class="wizard-header">
        <div class="flex items-center gap-2 mb-1">
          <a routerLink="/scheduling" class="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
            &larr; Volver a la Agenda
          </a>
        </div>
        <h1 class="text-2xl font-bold">Asistente de Agendamiento de Citas</h1>
        <p class="text-slate-500 text-sm">Flujo guiado en 6 pasos para seleccionar paciente, especialidad, especialista y horario</p>
      </div>

      <!-- Step Indicator Bar / Breadcrumbs -->
      <div class="steps-breadcrumbs card p-3">
        <div class="step-crumb" [class.active]="step() === 1" [class.completed]="step() > 1" (click)="goToStep(1)">
          <span class="step-num">1</span>
          <span class="step-label">Paciente: <b>{{ selectedPatient()?.fullName || 'Pendiente' }}</b></span>
        </div>
        <span class="crumb-separator">&rarr;</span>
        
        <div class="step-crumb" [class.active]="step() === 2" [class.completed]="step() > 2" (click)="step() > 2 && goToStep(2)">
          <span class="step-num">2</span>
          <span class="step-label">Área: <b>{{ selectedArea()?.name || 'Pendiente' }}</b></span>
        </div>
        <span class="crumb-separator">&rarr;</span>

        <div class="step-crumb" [class.active]="step() === 3" [class.completed]="step() > 3" (click)="step() > 3 && goToStep(3)">
          <span class="step-num">3</span>
          <span class="step-label">Especialidad: <b>{{ selectedSpecialty()?.name || 'Pendiente' }}</b></span>
        </div>
        <span class="crumb-separator">&rarr;</span>

        <div class="step-crumb" [class.active]="step() === 4" [class.completed]="step() > 4" (click)="step() > 4 && goToStep(4)">
          <span class="step-num">4</span>
          <span class="step-label">Procedimiento: <b>{{ selectedIntervention()?.name || 'Pendiente' }}</b></span>
        </div>
        <span class="crumb-separator">&rarr;</span>

        <div class="step-crumb" [class.active]="step() === 5" [class.completed]="step() > 5" (click)="step() > 5 && goToStep(5)">
          <span class="step-num">5</span>
          <span class="step-label">Especialista: <b>{{ selectedSpecialist()?.fullName || 'Pendiente' }}</b></span>
        </div>
        <span class="crumb-separator">&rarr;</span>

        <div class="step-crumb" [class.active]="step() === 6">
          <span class="step-num">6</span>
          <span class="step-label">Fecha y Turno</span>
        </div>
      </div>

      <!-- STEP 1: SELECT PATIENT -->
      @if (step() === 1) {
        <div class="card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold m-0">Paso 1: Seleccionar Paciente</h2>
            <input 
              type="text" 
              [(ngModel)]="patientFilter" 
              placeholder="Buscar paciente por documento o nombre..." 
              class="form-control max-w-xs" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            @for (pat of filteredPatients(); track pat.id) {
              <div 
                class="patient-card cursor-pointer p-3 border rounded-lg hover:border-sky-500 transition-colors"
                [class.border-sky-600]="selectedPatient()?.id === pat.id"
                [class.bg-sky-50]="selectedPatient()?.id === pat.id"
                [class.dark:bg-sky-900/30]="selectedPatient()?.id === pat.id"
                [class.dark:border-sky-400]="selectedPatient()?.id === pat.id"
                (click)="selectPatient(pat)">
                <div class="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {{ (pat.firstName[0] || pat.fullName[0] || 'P').toUpperCase() }}
                  </span>
                  <span>{{ pat.fullName || (pat.firstName + ' ' + pat.lastName) }}</span>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span class="doc-pill">
                    Doc: {{ pat.documentId }}
                  </span>
                  <span>•</span>
                  <span>{{ pat.age }} años</span>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Tel: {{ pat.phone || 'N/A' }}</div>
              </div>
            }
          </div>
        </div>
      }

      <!-- STEP 2: SELECT AREA -->
      @if (step() === 2) {
        <div class="card p-5 space-y-4">
          <h2 class="text-lg font-semibold m-0">Paso 2: Seleccionar Área Médica</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            @for (area of areas(); track area.id) {
              <div 
                class="option-card cursor-pointer p-4 border rounded-lg hover:border-blue-500 transition-all text-center"
                [class.border-blue-600]="selectedArea()?.id === area.id"
                [class.bg-blue-50]="selectedArea()?.id === area.id"
                [class.dark:bg-blue-900/30]="selectedArea()?.id === area.id"
                [class.dark:border-blue-400]="selectedArea()?.id === area.id"
                (click)="selectArea(area)">
                <div class="text-2xl mb-1">🏥</div>
                <div class="font-bold text-slate-900 dark:text-slate-100">{{ area.name }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ area.description || 'Sin descripción' }}</div>
              </div>
            }
          </div>
        </div>
      }

      <!-- STEP 3: SELECT SPECIALTY -->
      @if (step() === 3) {
        <div class="card p-5 space-y-4">
          <h2 class="text-lg font-semibold m-0">Paso 3: Seleccionar Especialidad ({{ selectedArea()?.name }})</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            @for (spec of availableSpecialties(); track spec.id) {
              <div 
                class="option-card cursor-pointer p-4 border rounded-lg hover:border-blue-500 transition-all text-center"
                [class.border-blue-600]="selectedSpecialty()?.id === spec.id"
                [class.bg-blue-50]="selectedSpecialty()?.id === spec.id"
                [class.dark:bg-blue-900/30]="selectedSpecialty()?.id === spec.id"
                [class.dark:border-blue-400]="selectedSpecialty()?.id === spec.id"
                (click)="selectSpecialty(spec)">
                <div class="text-2xl mb-1">⚕️</div>
                <div class="font-bold text-slate-900 dark:text-slate-100">{{ spec.name }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ spec.description || 'Especialidad clínica' }}</div>
              </div>
            }
          </div>
        </div>
      }

      <!-- STEP 4: SELECT INTERVENTION / PROCEDURE -->
      @if (step() === 4) {
        <div class="card p-5 space-y-4">
          <h2 class="text-lg font-semibold m-0">Paso 4: Seleccionar Procedimiento / Tipo de Consulta</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (it of availableInterventions(); track it.id) {
              <div 
                class="option-card cursor-pointer p-4 border rounded-lg hover:border-blue-500 transition-all"
                [class.border-blue-600]="selectedIntervention()?.id === it.id"
                [class.bg-blue-50]="selectedIntervention()?.id === it.id"
                [class.dark:bg-blue-900/30]="selectedIntervention()?.id === it.id"
                [class.dark:border-blue-400]="selectedIntervention()?.id === it.id"
                (click)="selectIntervention(it)">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sm text-slate-900 dark:text-slate-100">{{ it.name }}</span>
                  <span class="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">⏱️ {{ it.durationMinutes }}m</span>
                </div>
                @if (it.code) {
                  <span class="text-xs text-slate-500 dark:text-slate-400 block mt-1">Código: {{ it.code }}</span>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- STEP 5: SELECT SPECIALIST -->
      @if (step() === 5) {
        <div class="card p-5 space-y-4">
          <h2 class="text-lg font-semibold m-0">Paso 5: Seleccionar Especialista Médico</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (doc of availableSpecialists(); track doc.id) {
              <div 
                class="option-card cursor-pointer p-4 border rounded-lg hover:border-blue-500 transition-all"
                [class.border-blue-600]="selectedSpecialist()?.id === doc.id"
                [class.bg-blue-50]="selectedSpecialist()?.id === doc.id"
                [class.dark:bg-blue-900/30]="selectedSpecialist()?.id === doc.id"
                [class.dark:border-blue-400]="selectedSpecialist()?.id === doc.id"
                (click)="selectSpecialist(doc)">
                <div class="font-bold text-sm text-slate-900 dark:text-slate-100">👨‍⚕️ {{ doc.fullName }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Licencia: {{ doc.licenseNumber }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Email: {{ doc.email || 'N/A' }}</div>
              </div>
            }
          </div>
        </div>
      }

      <!-- STEP 6: SELECT DATE & DYNAMIC TIME SLOT -->
      @if (step() === 6) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Left: Date Picker & Notes -->
          <div class="card p-5 space-y-4">
            <h2 class="text-base font-semibold m-0">Seleccionar Fecha</h2>
            <div>
              <label class="form-label">Fecha de la Cita *</label>
              <input 
                type="date" 
                [(ngModel)]="selectedDate" 
                (ngModelChange)="onDateChange()"
                [min]="todayStr"
                class="form-control" />
            </div>

            <div>
              <label class="form-label">Motivo o Notas Opcionales</label>
              <textarea 
                [(ngModel)]="bookingNotes" 
                rows="3" 
                class="form-control" 
                placeholder="Observaciones de la cita..."></textarea>
            </div>
          </div>

          <!-- Right: Dynamic 30-min Slot Grid -->
          <div class="md:col-span-2 card p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold m-0">Turnos Disponibles (Slots)</h2>
              @if (loadingSlots()) {
                <span class="text-xs text-slate-500 flex items-center gap-1">
                  <span class="spinner-sm"></span> Consultando agenda...
                </span>
              }
            </div>

            @if (slots().length === 0 && !loadingSlots()) {
              <div class="p-8 text-center text-slate-400">
                <p>No hay turnos ni horarios configurados para este especialista en la fecha seleccionada.</p>
                <p class="text-xs text-slate-500">Intente seleccionando otro día de la semana.</p>
              </div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto p-1">
                @for (slot of slots(); track slot.startTime) {
                  <button 
                    type="button" 
                    [disabled]="!slot.isAvailable"
                    class="slot-btn p-2 rounded-lg text-xs font-semibold text-center border transition-all"
                    [class.slot-available]="slot.isAvailable"
                    [class.slot-occupied]="!slot.isAvailable"
                    [class.slot-selected]="selectedSlot()?.startTime === slot.startTime"
                    (click)="selectSlot(slot)">
                    {{ formatSlotTime(slot.startTime) }} - {{ formatSlotTime(slot.endTime) }}
                    @if (!slot.isAvailable) {
                      <span class="block text-[10px] text-rose-500 font-normal">Ocupado</span>
                    }
                  </button>
                }
              </div>
            }

            <!-- Summary & Confirm Button -->
            @if (selectedSlot()) {
              <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                <div>
                  <span class="text-xs text-emerald-800 dark:text-emerald-300 font-bold block">TURNO SELECCIONADO</span>
                  <span class="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    {{ selectedDate }} a las {{ formatSlotTime(selectedSlot()!.startTime) }} ({{ selectedIntervention()?.durationMinutes }} min)
                  </span>
                </div>
                <button 
                  type="button" 
                  class="btn btn-primary" 
                  [disabled]="booking()" 
                  (click)="confirmBooking()">
                  @if (booking()) {
                    <span class="spinner-sm mr-1.5"></span>
                  }
                  Confirmar Agendamiento
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .wizard-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .steps-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow-x: auto;
      font-size: 0.8125rem;
    }
    .step-crumb {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      border-radius: 0.375rem;
      color: var(--text-muted, #64748b);
      white-space: nowrap;
    }
    .step-crumb.active {
      background-color: var(--primary-light, #eff6ff);
      color: var(--primary-color, #2563eb);
      font-weight: 600;
    }
    :host-context(.dark) .step-crumb.active {
      background-color: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
    }
    .step-crumb.completed {
      cursor: pointer;
      color: #059669;
    }
    :host-context(.dark) .step-crumb.completed {
      color: #34d399;
    }
    .step-num {
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 9999px;
      background: currentColor;
      color: white;
      font-size: 0.6875rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host-context(.dark) .step-num { color: #0b1120; }
    .step-crumb.active .step-num { background: var(--primary-color, #2563eb); color: #ffffff; }
    .step-crumb.completed .step-num { background: #059669; color: #ffffff; }
    :host-context(.dark) .step-crumb.completed .step-num { background: #34d399; color: #0b1120; }
    .crumb-separator { color: var(--border-color, #cbd5e1); font-size: 0.75rem; }

    .slot-available {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
      cursor: pointer;
    }
    .slot-available:hover {
      background: #dcfce7;
      border-color: #86efac;
    }
    :host-context(.dark) .slot-available {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.3);
      color: #6ee7b7;
    }
    :host-context(.dark) .slot-available:hover {
      background: rgba(16, 185, 129, 0.25);
      border-color: #34d399;
    }

    .slot-occupied {
      background: #f1f5f9;
      border-color: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      opacity: 0.6;
    }
    :host-context(.dark) .slot-occupied {
      background: #1e293b;
      border-color: #334155;
      color: #64748b;
    }

    .slot-selected {
      background: var(--primary-color, #0284c7) !important;
      border-color: var(--primary-hover, #0369a1) !important;
      color: #ffffff !important;
      box-shadow: 0 0 0 2px var(--primary-glow);
    }
  `]
})
export class BookingWizardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly step = signal<number>(1);

  readonly patients = signal<PatientDto[]>([]);
  readonly areas = signal<AreaDto[]>([]);
  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly interventions = signal<InterventionTypeDto[]>([]);
  readonly specialists = signal<SpecialistDto[]>([]);

  readonly selectedPatient = signal<PatientDto | null>(null);
  readonly selectedArea = signal<AreaDto | null>(null);
  readonly selectedSpecialty = signal<SpecialtyDto | null>(null);
  readonly selectedIntervention = signal<InterventionTypeDto | null>(null);
  readonly selectedSpecialist = signal<SpecialistDto | null>(null);
  readonly selectedSlot = signal<TimeSlotDto | null>(null);

  readonly slots = signal<TimeSlotDto[]>([]);
  readonly loadingSlots = signal<boolean>(false);
  readonly booking = signal<boolean>(false);

  patientFilter: string = '';
  selectedDate: string = new Date().toISOString().substring(0, 10);
  bookingNotes: string = '';

  get todayStr(): string {
    return new Date().toISOString().substring(0, 10);
  }

  readonly filteredPatients = computed(() => {
    const q = this.patientFilter.trim().toLowerCase();
    if (!q) return this.patients();
    return this.patients().filter(p => 
      p.fullName.toLowerCase().includes(q) || p.documentId.includes(q)
    );
  });

  readonly availableSpecialties = computed(() => {
    const area = this.selectedArea();
    if (!area) return [];
    return this.specialties().filter(s => s.areaId === area.id);
  });

  readonly availableInterventions = computed(() => {
    const spec = this.selectedSpecialty();
    if (!spec) return [];
    return this.interventions().filter(i => i.specialtyId === spec.id);
  });

  readonly availableSpecialists = computed(() => {
    const spec = this.selectedSpecialty();
    if (!spec) return [];
    return this.specialists().filter(s => s.specialtyId === spec.id);
  });

  ngOnInit(): void {
    this.loadCatalogues();
  }

  loadCatalogues(): void {
    forkJoin({
      patients: this.http.get<ApiResponse<PatientDto[]>>(`${environment.apiUrl}/patients`),
      areas: this.http.get<ApiResponse<AreaDto[]>>(`${environment.apiUrl}/areas`),
      specialties: this.http.get<ApiResponse<SpecialtyDto[]>>(`${environment.apiUrl}/specialties`),
      interventions: this.http.get<ApiResponse<InterventionTypeDto[]>>(`${environment.apiUrl}/intervention-types`),
      specialists: this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/specialists`)
    }).subscribe({
      next: (res) => {
        const pats = (res.patients.data || []).map(p => ({
          ...p,
          fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim()
        }));
        this.patients.set(pats);
        this.areas.set(res.areas.data || []);
        this.specialties.set(res.specialties.data || []);
        this.interventions.set(res.interventions.data || []);
        this.specialists.set(res.specialists.data || []);

        // Check if preselected patient from queryParams
        const queryPatientId = this.route.snapshot.queryParams['patientId'];
        if (queryPatientId) {
          const found = this.patients().find(p => p.id === queryPatientId);
          if (found) {
            this.selectPatient(found);
          }
        }
      }
    });
  }

  selectPatient(pat: PatientDto): void {
    this.selectedPatient.set(pat);
    this.step.set(2);
  }

  selectArea(area: AreaDto): void {
    this.selectedArea.set(area);
    this.selectedSpecialty.set(null);
    this.selectedIntervention.set(null);
    this.selectedSpecialist.set(null);
    this.step.set(3);
  }

  selectSpecialty(spec: SpecialtyDto): void {
    this.selectedSpecialty.set(spec);
    this.selectedIntervention.set(null);
    this.selectedSpecialist.set(null);
    this.step.set(4);
  }

  selectIntervention(it: InterventionTypeDto): void {
    this.selectedIntervention.set(it);
    this.selectedSpecialist.set(null);
    this.step.set(5);
  }

  selectSpecialist(doc: SpecialistDto): void {
    this.selectedSpecialist.set(doc);
    this.step.set(6);
    this.loadSlots();
  }

  selectSlot(slot: TimeSlotDto): void {
    this.selectedSlot.set(slot);
  }

  goToStep(s: number): void {
    this.step.set(s);
  }

  onDateChange(): void {
    this.selectedSlot.set(null);
    this.loadSlots();
  }

  loadSlots(): void {
    const doc = this.selectedSpecialist();
    if (!doc || !this.selectedDate) return;

    this.loadingSlots.set(true);
    this.http.get<ApiResponse<TimeSlotDto[]>>(`${environment.apiUrl}/specialists/${doc.id}/slots?date=${this.selectedDate}`).subscribe({
      next: (res) => {
        this.loadingSlots.set(false);
        this.slots.set(res.data || []);
      },
      error: () => this.loadingSlots.set(false)
    });
  }

  formatSlotTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  confirmBooking(): void {
    const pat = this.selectedPatient();
    const doc = this.selectedSpecialist();
    const it = this.selectedIntervention();
    const slot = this.selectedSlot();

    if (!pat || !doc || !it || !slot) return;

    this.booking.set(true);
    const payload = {
      patientId: pat.id,
      specialistId: doc.id,
      interventionTypeId: it.id,
      scheduledAt: slot.startTime,
      durationMinutes: it.durationMinutes,
      notes: this.bookingNotes || null
    };

    this.http.post<ApiResponse<SchedulingDto>>(`${environment.apiUrl}/scheduling`, payload).subscribe({
      next: () => {
        this.booking.set(false);
        this.toast.success('Cita médica agendada exitosamente.');
        this.router.navigate(['/scheduling']);
      },
      error: () => this.booking.set(false)
    });
  }
}
