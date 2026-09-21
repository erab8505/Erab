import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppointmentStatus, PaymentDto, PaymentMethod, PaymentStatus, SchedulingDto, SpecialistDto } from '../../../core/models/models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

export type CalendarViewMode = 'day' | 'week';

interface CalendarAppointmentBlock {
  appointment: SchedulingDto;
  topPercent: number;
  heightPercent: number;
  startTimeLabel: string;
  endTimeLabel: string;
}

interface SpecialistColumn {
  specialist: SpecialistDto;
  appointments: CalendarAppointmentBlock[];
}

interface DayColumn {
  date: Date;
  dayLabel: string;
  dateLabel: string;
  isToday: boolean;
  appointments: CalendarAppointmentBlock[];
}

@Component({
  selector: 'app-timegrid-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-wrapper">
      <!-- Calendar Controls Toolbar -->
      <div class="calendar-toolbar">
        <!-- Date Navigation -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="btn-group">
            <button type="button" class="btn btn-secondary btn-sm" (click)="navigatePrevious()" title="Anterior">
              &lt;
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="goToToday()">
              Hoy
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="navigateNext()" title="Siguiente">
              &gt;
            </button>
          </div>

          <h2 class="current-date-title">
            {{ currentDateDisplay() }}
          </h2>
        </div>

        <!-- Filters & View Switcher -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Specialist Filter -->
          <div class="flex items-center gap-1.5">
            <label class="text-xs font-semibold text-slate-500">Médico:</label>
            <select
              [ngModel]="selectedSpecialistId()"
              (ngModelChange)="onSpecialistFilterChange($event)"
              class="form-select-sm">
              <option value="">Todos los Médicos</option>
              @for (doc of specialists; track doc.id) {
                <option [value]="doc.id">👨‍⚕️ {{ doc.fullName }}</option>
              }
            </select>
          </div>

          <!-- View Mode (Day / Week) -->
          <div class="btn-group">
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="viewMode() === 'day'"
              [class.btn-secondary]="viewMode() !== 'day'"
              (click)="setViewMode('day')">
              Día (Especialistas)
            </button>
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="viewMode() === 'week'"
              [class.btn-secondary]="viewMode() !== 'week'"
              (click)="setViewMode('week')">
              Semana
            </button>
          </div>
        </div>
      </div>

      <!-- TimeGrid Main Container -->
      <div class="timegrid-container">
        <div class="timegrid-scroll-wrapper">
          <div class="timegrid-inner" [style.min-width]="innerMinWidth()">
            <!-- TimeGrid Header (Columns Names) -->
            <div class="timegrid-header-row">
              <!-- Time Axis Corner -->
              <div class="time-axis-corner">
                <span class="text-[10px] uppercase font-bold text-slate-400">Hora</span>
              </div>

              <!-- Columns Headers -->
              <div class="grid-columns-header" [style.grid-template-columns]="gridColumnsTemplate()">
                @if (viewMode() === 'day') {
                  @for (col of specialistColumns(); track col.specialist.id) {
                    <div class="col-header">
                      <span class="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                        👨‍⚕️ {{ col.specialist.fullName }}
                      </span>
                      <span class="text-[11px] text-slate-400">
                        {{ col.appointments.length }} {{ col.appointments.length === 1 ? 'cita' : 'citas' }}
                      </span>
                    </div>
                  }
                } @else {
                  @for (day of weekDays(); track day.date.toISOString()) {
                    <div class="col-header" [class.today-header]="day.isToday">
                      <span class="font-bold text-xs uppercase" [class.text-blue-600]="day.isToday">
                        {{ day.dayLabel }}
                      </span>
                      <span class="text-[11px]" [class.font-bold]="day.isToday">
                        {{ day.dateLabel }}
                      </span>
                    </div>
                  }
                }
              </div>
            </div>

            <!-- TimeGrid Body (Hour Rows & Columns) -->
            <div class="timegrid-body-scroll">
              <div class="timegrid-body">
                <!-- Left Time Axis Labels (07:00 to 20:00) -->
                <div class="time-axis-column">
                  @for (hour of timeSlots(); track hour.timeString) {
                    <div class="time-slot-label">
                      <span>{{ hour.timeString }}</span>
                    </div>
                  }
                </div>

                <!-- Columns Content Grid -->
                <div class="grid-columns-body" [style.grid-template-columns]="gridColumnsTemplate()">
                  @if (viewMode() === 'day') {
                    @for (col of specialistColumns(); track col.specialist.id) {
                      <div class="timegrid-column">
                        <!-- Background Grid Lines -->
                        @for (hour of timeSlots(); track hour.timeString) {
                          <div
                            class="hour-cell"
                            (click)="onEmptySlotClicked(currentDate(), hour.hour, 0, col.specialist.id)"
                            title="Clic para agendar a las {{ hour.timeString }} con {{ col.specialist.fullName }}">
                          </div>
                        }

                        <!-- Current Time Indicator -->
                        @if (isTodayCurrentDate() && nowPercent() >= 0 && nowPercent() <= 100) {
                          <div class="now-indicator" [style.top.%]="nowPercent()">
                            <div class="now-dot"></div>
                          </div>
                        }

                        <!-- Appointments Blocks -->
                        @for (block of col.appointments; track block.appointment.id) {
                          <div
                            class="appointment-block"
                            [class]="'status-' + block.appointment.status.toLowerCase()"
                            [style.top.%]="block.topPercent"
                            [style.height.%]="block.heightPercent"
                            (click)="selectAppointment(block.appointment, $event)">
                            
                            <div class="appt-card-inner">
                              <div class="flex items-center justify-between gap-1">
                                <span class="appt-time font-mono">{{ block.startTimeLabel }} - {{ block.endTimeLabel }}</span>
                                <!-- Payment indicator badge -->
                                @if (block.appointment.paymentStatus === 'Paid') {
                                  <span class="badge-mini-paid" [title]="'Pagado: $' + block.appointment.paymentAmount">💵 Pagado</span>
                                } @else if (block.appointment.paymentStatus === 'Pending' && block.appointment.status === 'Completed') {
                                  <span class="badge-mini-pending" title="Cobro Pendiente">⏳ Pend.</span>
                                }
                              </div>

                              <div class="appt-patient font-bold truncate">
                                {{ block.appointment.patientName }}
                              </div>

                              <div class="appt-procedure text-[11px] truncate opacity-90">
                                🩺 {{ block.appointment.interventionTypeName || block.appointment.interventionName || 'Consulta' }}
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  } @else {
                    @for (day of weekDays(); track day.date.toISOString()) {
                      <div class="timegrid-column" [class.today-column]="day.isToday">
                        <!-- Background Grid Lines -->
                        @for (hour of timeSlots(); track hour.timeString) {
                          <div
                            class="hour-cell"
                            (click)="onEmptySlotClicked(day.date, hour.hour, 0, selectedSpecialistId() || undefined)"
                            title="Clic para agendar el {{ day.dayLabel }} a las {{ hour.timeString }}">
                          </div>
                        }

                        <!-- Current Time Indicator -->
                        @if (day.isToday && nowPercent() >= 0 && nowPercent() <= 100) {
                          <div class="now-indicator" [style.top.%]="nowPercent()">
                            <div class="now-dot"></div>
                          </div>
                        }

                        <!-- Appointments Blocks -->
                        @for (block of day.appointments; track block.appointment.id) {
                          <div
                            class="appointment-block"
                            [class]="'status-' + block.appointment.status.toLowerCase()"
                            [style.top.%]="block.topPercent"
                            [style.height.%]="block.heightPercent"
                            (click)="selectAppointment(block.appointment, $event)">
                            
                            <div class="appt-card-inner">
                              <div class="flex items-center justify-between gap-1">
                                <span class="appt-time font-mono">{{ block.startTimeLabel }}</span>
                                @if (block.appointment.paymentStatus === 'Paid') {
                                  <span class="badge-mini-paid">💵</span>
                                }
                              </div>

                              <div class="appt-patient font-bold truncate">
                                {{ block.appointment.patientName }}
                              </div>

                              <div class="appt-procedure text-[10px] truncate opacity-90">
                                👨‍⚕️ {{ block.appointment.specialistName }}
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-wrapper {
      display: flex;
      flex-direction: column;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .calendar-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      background: var(--card-footer-bg, #f8fafc);
      flex-wrap: wrap;
    }
    .current-date-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color, #0f172a);
      margin: 0;
      text-transform: capitalize;
    }
    .btn-group {
      display: inline-flex;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .btn-group .btn {
      border-radius: 0;
      border-right-width: 0;
    }
    .btn-group .btn:first-child {
      border-top-left-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;
    }
    .btn-group .btn:last-child {
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
      border-right-width: 1px;
    }
    .form-select-sm {
      font-size: 0.75rem;
      padding: 0.25rem 0.625rem;
      border-radius: 0.375rem;
      border: 1px solid var(--border-color, #cbd5e1);
      background: var(--card-bg, #ffffff);
      color: var(--text-color, #0f172a);
    }
    .timegrid-container {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      width: 100%;
    }
    .timegrid-scroll-wrapper {
      overflow-x: auto;
      width: 100%;
      -webkit-overflow-scrolling: touch;
    }
    .timegrid-inner {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .timegrid-header-row {
      display: flex;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      background: var(--card-footer-bg, #f8fafc);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .time-axis-corner {
      width: 60px;
      min-width: 60px;
      border-right: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      position: sticky;
      left: 0;
      z-index: 20;
      background: var(--card-footer-bg, #f8fafc);
    }
    :host-context(.dark) .time-axis-corner {
      background: var(--card-footer-bg, #0f1d2e);
    }
    .grid-columns-header {
      display: grid;
      flex: 1;
    }
    .col-header {
      padding: 0.625rem 0.5rem;
      text-align: center;
      border-right: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .col-header:last-child {
      border-right: none;
    }
    .col-header.today-header {
      background: #eff6ff;
    }
    :host-context(.dark) .col-header.today-header {
      background: #1e293b;
    }
    .timegrid-body-scroll {
      max-height: 620px;
      overflow-y: auto;
    }
    .timegrid-body {
      display: flex;
      position: relative;
      min-height: 780px; /* 13 hours * 60px */
    }
    .time-axis-column {
      width: 60px;
      min-width: 60px;
      border-right: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      flex-direction: column;
      user-select: none;
      position: sticky;
      left: 0;
      z-index: 11;
      background: var(--card-bg, #ffffff);
    }
    :host-context(.dark) .time-axis-column {
      background: var(--card-bg, #13253a);
    }
    .time-slot-label {
      height: 60px;
      box-sizing: border-box;
      padding-right: 0.375rem;
      text-align: right;
      font-size: 0.6875rem;
      font-family: 'JetBrains Mono', monospace;
      color: #94a3b8;
      border-bottom: 1px solid transparent;
      transform: translateY(-8px);
    }
    .grid-columns-body {
      display: grid;
      flex: 1;
      position: relative;
    }
    .timegrid-column {
      border-right: 1px solid var(--border-color, #e2e8f0);
      position: relative;
      box-sizing: border-box;
    }
    .timegrid-column:last-child {
      border-right: none;
    }
    .today-column {
      background: rgba(239, 246, 255, 0.3);
    }
    :host-context(.dark) .today-column {
      background: rgba(30, 41, 59, 0.3);
    }
    .hour-cell {
      height: 60px;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      cursor: pointer;
      transition: background-color 0.1s;
    }
    :host-context(.dark) .hour-cell {
      border-bottom-color: #1e293b;
    }
    .hour-cell:hover {
      background-color: rgba(2, 132, 199, 0.06);
    }
    .now-indicator {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: #ef4444;
      z-index: 5;
      pointer-events: none;
    }
    .now-dot {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background: #ef4444;
      position: absolute;
      left: -4px;
      top: -3px;
    }
    .appointment-block {
      position: absolute;
      left: 3px;
      right: 3px;
      border-radius: 0.375rem;
      overflow: hidden;
      cursor: pointer;
      z-index: 4;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .appointment-block:hover {
      transform: scale(1.02);
      z-index: 8;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .appt-card-inner {
      padding: 0.3rem 0.4rem;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0.1rem;
    }
    .appt-time {
      font-size: 0.65rem;
      font-weight: 700;
    }
    .appt-patient {
      font-size: 0.75rem;
      line-height: 1.1;
    }
    .badge-mini-paid {
      font-size: 0.6rem;
      font-weight: 800;
      background: #166534;
      color: #ffffff;
      padding: 0.05rem 0.3rem;
      border-radius: 0.25rem;
    }
    .badge-mini-pending {
      font-size: 0.6rem;
      font-weight: 800;
      background: #ca8a04;
      color: #ffffff;
      padding: 0.05rem 0.3rem;
      border-radius: 0.25rem;
    }

    /* Appointment Status Color Themes */
    .status-scheduled {
      background: #dbeafe;
      border-left: 3px solid #2563eb;
      color: #1e40af;
    }
    :host-context(.dark) .status-scheduled {
      background: #1e3a5f;
      border-left-color: #38bdf8;
      color: #93c5fd;
    }
    .status-confirmed {
      background: #dcfce7;
      border-left: 3px solid #16a34a;
      color: #166534;
    }
    :host-context(.dark) .status-confirmed {
      background: #143823;
      border-left-color: #34d399;
      color: #86efac;
    }
    .status-completed {
      background: #f1f5f9;
      border-left: 3px solid #64748b;
      color: #334155;
    }
    :host-context(.dark) .status-completed {
      background: #1e293b;
      border-left-color: #94a3b8;
      color: #cbd5e1;
    }
    .status-cancelled {
      background: #fee2e2;
      border-left: 3px solid #dc2626;
      color: #991b1b;
      opacity: 0.75;
    }
    :host-context(.dark) .status-cancelled {
      background: #3c1e1e;
      border-left-color: #f87171;
      color: #fca5a5;
    }
    .status-rescheduled {
      background: #fef3c7;
      border-left: 3px solid #d97706;
      color: #92400e;
    }
    :host-context(.dark) .status-rescheduled {
      background: #3b2c14;
      border-left-color: #fbbf24;
      color: #fde68a;
    }
  `]
})
export class TimegridCalendarComponent implements OnInit {
  @Input() appointments: SchedulingDto[] = [];
  @Input() specialists: SpecialistDto[] = [];
  @Output() appointmentSelected = new EventEmitter<SchedulingDto>();
  @Output() emptySlotClicked = new EventEmitter<{ date: Date; hour: number; minute: number; specialistId?: string }>();
  @Output() dateRangeChanged = new EventEmitter<{ startDate: Date; endDate: Date }>();

  viewMode = signal<CalendarViewMode>('day');
  currentDate = signal<Date>(new Date());
  selectedSpecialistId = signal<string>('');

  startHour = 7;  // 07:00
  endHour = 20;   // 20:00 (13 hours total)
  totalHours = 13;

  ngOnInit(): void {
    this.emitDateRange();
  }

  setViewMode(mode: CalendarViewMode): void {
    this.viewMode.set(mode);
    this.emitDateRange();
  }

  onSpecialistFilterChange(specialistId: string): void {
    this.selectedSpecialistId.set(specialistId);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.emitDateRange();
  }

  navigatePrevious(): void {
    const cur = new Date(this.currentDate());
    if (this.viewMode() === 'day') {
      cur.setDate(cur.getDate() - 1);
    } else {
      cur.setDate(cur.getDate() - 7);
    }
    this.currentDate.set(cur);
    this.emitDateRange();
  }

  navigateNext(): void {
    const cur = new Date(this.currentDate());
    if (this.viewMode() === 'day') {
      cur.setDate(cur.getDate() + 1);
    } else {
      cur.setDate(cur.getDate() + 7);
    }
    this.currentDate.set(cur);
    this.emitDateRange();
  }

  private emitDateRange(): void {
    if (this.viewMode() === 'day') {
      const start = new Date(this.currentDate());
      start.setHours(0, 0, 0, 0);
      const end = new Date(this.currentDate());
      end.setHours(23, 59, 59, 999);
      this.dateRangeChanged.emit({ startDate: start, endDate: end });
    } else {
      const { start, end } = this.getWeekRange(this.currentDate());
      this.dateRangeChanged.emit({ startDate: start, endDate: end });
    }
  }

  currentDateDisplay(): string {
    const d = this.currentDate();
    if (this.viewMode() === 'day') {
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      const { start, end } = this.getWeekRange(d);
      return `Semana del ${start.getDate()} al ${end.getDate()} de ${end.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
    }
  }

  timeSlots(): { hour: number; timeString: string }[] {
    const slots = [];
    for (let h = this.startHour; h <= this.endHour; h++) {
      slots.push({
        hour: h,
        timeString: `${h.toString().padStart(2, '0')}:00`
      });
    }
    return slots;
  }

  gridColumnsTemplate(): string {
    if (this.viewMode() === 'day') {
      const cols = this.specialistColumns().length;
      return `repeat(${Math.max(1, cols)}, minmax(180px, 1fr))`;
    } else {
      return `repeat(7, minmax(130px, 1fr))`;
    }
  }

  isTodayCurrentDate(): boolean {
    const today = new Date();
    const cur = this.currentDate();
    return today.toDateString() === cur.toDateString();
  }

  nowPercent(): number {
    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.startHour * 60;
    const totalMinutes = this.totalHours * 60;
    return ((curMinutes - startMinutes) / totalMinutes) * 100;
  }

  specialistColumns(): SpecialistColumn[] {
    let list = this.specialists;
    if (this.selectedSpecialistId()) {
      list = list.filter(s => s.id === this.selectedSpecialistId());
    }

    const curDateStr = this.currentDate().toISOString().split('T')[0];

    return list.map(s => {
      const appts = this.appointments.filter(a => {
        const apptDate = a.scheduledAt.split('T')[0];
        return a.specialistId === s.id && apptDate === curDateStr;
      });

      return {
        specialist: s,
        appointments: appts.map(a => this.mapToBlock(a))
      };
    });
  }

  weekDays(): DayColumn[] {
    const { start } = this.getWeekRange(this.currentDate());
    const todayStr = new Date().toDateString();
    const days: DayColumn[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);

      const dStr = d.toISOString().split('T')[0];
      const appts = this.appointments.filter(a => {
        const apptDate = a.scheduledAt.split('T')[0];
        const specMatch = !this.selectedSpecialistId() || a.specialistId === this.selectedSpecialistId();
        return apptDate === dStr && specMatch;
      });

      days.push({
        date: d,
        dayLabel: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        dateLabel: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        isToday: d.toDateString() === todayStr,
        appointments: appts.map(a => this.mapToBlock(a))
      });
    }

    return days;
  }

  private mapToBlock(a: SchedulingDto): CalendarAppointmentBlock {
    const date = new Date(a.scheduledAt);
    const startMinutes = date.getHours() * 60 + date.getMinutes();
    const dayStartMinutes = this.startHour * 60;
    const totalMinutes = this.totalHours * 60;

    const topPercent = Math.max(0, ((startMinutes - dayStartMinutes) / totalMinutes) * 100);
    const duration = a.durationMinutes || 30;
    const heightPercent = Math.max(3.5, (duration / totalMinutes) * 100);

    const endDate = new Date(date.getTime() + duration * 60000);

    return {
      appointment: a,
      topPercent,
      heightPercent,
      startTimeLabel: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      endTimeLabel: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
    };
  }

  private getWeekRange(date: Date): { start: Date; end: Date } {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  innerMinWidth(): string {
    if (this.viewMode() === 'day') {
      const cols = Math.max(1, this.specialistColumns().length);
      return `${60 + cols * 180}px`;
    } else {
      return '970px';
    }
  }

  selectAppointment(appt: SchedulingDto, event: Event): void {
    event.stopPropagation();
    this.appointmentSelected.emit(appt);
  }

  onEmptySlotClicked(date: Date, hour: number, minute: number, specialistId?: string): void {
    this.emptySlotClicked.emit({ date, hour, minute, specialistId });
  }
}
