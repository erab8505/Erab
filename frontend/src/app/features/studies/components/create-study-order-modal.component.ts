import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ClinicalStudyDto, CreateStudyOrderDto, PatientDto, SpecialistDto, StudyOrderDto } from '../../../core/models/models';
import { ClinicalStudyService } from '../../../core/services/clinical-study.service';
import { StudyOrderService } from '../../../core/services/study-order.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-create-study-order-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="Nueva Orden de Estudios Clínicos / Laboratorio"
      size="lg"
      (closed)="close()">

      <div class="space-y-4">
        <!-- Patient and Doctor Selection -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <!-- 1. PATIENT SELECTOR -->
          <div class="relative">
            <label class="form-label font-bold text-xs">Paciente *</label>
            @if (selectedPatient()) {
              <div class="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between border border-blue-200 dark:border-blue-800 shadow-xs">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-base shrink-0">👤</span>
                  <div class="truncate">
                    <div class="truncate">{{ selectedPatient()?.firstName }} {{ selectedPatient()?.lastName }}</div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                      Doc: {{ selectedPatient()?.documentId || 'N/A' }} <br>• Tel: {{ selectedPatient()?.phone || 'N/A' }}
                    </div>
                  </div>
                </div>
                @if (!preselectedPatient) {
                  <button type="button" class="btn btn-secondary btn-xs shrink-0 ml-2" (click)="clearPatient()">
                    ✕ Cambiar
                  </button>
                }
              </div>
            } @else {
              <div class="relative">
                <input
                  type="text"
                  [ngModel]="patientSearchText"
                  (ngModelChange)="onPatientSearchInput($event)"
                  (focus)="patientDropdownOpen.set(true)"
                  class="form-control text-xs pl-8 pr-7"
                  placeholder="🔍 Buscar paciente por documento, nombre o apellido..." />
                <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
                @if (loadingPatients) {
                  <span class="spinner-sm absolute right-2.5 top-2.5"></span>
                }

                @if (patientDropdownOpen() && searchedPatients().length > 0) {
                  <div class="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 divide-y divide-slate-100 dark:divide-slate-800">
                    @for (p of searchedPatients(); track p.id) {
                      <div
                        (click)="selectPatient(p)"
                        class="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors">
                        <div>
                          <span class="font-bold text-slate-800 dark:text-slate-100 block">{{ p.firstName }} {{ p.lastName }}</span>
                          <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Doc: {{ p.documentId || 'N/A' }} • Tel: {{ p.phone || 'N/A' }}</span>
                        </div>
                        <span class="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono shrink-0">
                          {{ p.age }} años
                        </span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- 2. SPECIALIST SELECTOR -->
          <div class="relative">
            <label class="form-label font-bold text-xs">Médico Solicitante (Opcional)</label>
            @if (selectedSpecialist()) {
              <div class="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between border border-slate-200 dark:border-slate-700 shadow-xs">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-base shrink-0">👨‍⚕️</span>
                  <div class="truncate">
                    <div class="truncate">{{ selectedSpecialist()?.fullName || (selectedSpecialist()?.firstName + ' ' + selectedSpecialist()?.lastName) }}</div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                      {{ selectedSpecialist()?.specialtyName }} <br>• Lic: {{ selectedSpecialist()?.licenseNumber || 'N/A' }}
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-secondary btn-xs shrink-0 ml-2" (click)="clearSpecialist()">
                  ✕ Cambiar
                </button>
              </div>
            } @else if (form.specialistId === null && specialistSearchChosen) {
              <div class="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between border border-slate-200 dark:border-slate-700 shadow-xs">
                <div class="flex items-center gap-2">
                  <span class="text-base shrink-0">🏢</span>
                  <span>Mostrador de Recepción / Sin Médico Solicitante</span>
                </div>
                <button type="button" class="btn btn-secondary btn-xs shrink-0 ml-2" (click)="clearSpecialist()">
                  ✕ Cambiar
                </button>
              </div>
            } @else {
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="specialistSearchQuery"
                  (focus)="specialistDropdownOpen.set(true)"
                  class="form-control text-xs pl-8 pr-7"
                  placeholder="🔍 Buscar médico por nombre o especialidad..." />
                <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>

                @if (specialistDropdownOpen()) {
                  <div class="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 divide-y divide-slate-100 dark:divide-slate-800">
                    <div
                      (click)="chooseReceptionCounter()"
                      class="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors">
                      <span class="text-base">🏢</span>
                      <div>
                        <div>Mostrador de Recepción</div>
                        <div class="text-[10px] text-slate-400 font-normal">Sin médico solicitante asignado</div>
                      </div>
                    </div>

                    @for (spec of filteredSpecialists(); track spec.id) {
                      <div
                        (click)="selectSpecialist(spec)"
                        class="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors">
                        <div>
                          <span class="font-bold text-slate-800 dark:text-slate-100 block">👨‍⚕️ {{ spec.fullName || (spec.firstName + ' ' + spec.lastName) }}</span>
                          <span class="text-[10px] text-slate-500 dark:text-slate-400">{{ spec.specialtyName }}</span>
                        </div>
                        @if (spec.licenseNumber) {
                          <span class="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono shrink-0">
                            {{ spec.licenseNumber }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <div>
          <label class="form-label font-bold text-xs">Diagnóstico Presuntivo / Indicación Clínica</label>
          <input
            type="text"
            [(ngModel)]="form.clinicalDiagnosis"
            class="form-control text-xs"
            placeholder="Ej. Control de diabetes, sospecha de anemia, chequeo anual..." />
        </div>

        <!-- Study Selection Matrix -->
        <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>🧪</span> Seleccione los Estudios a Realizar *
            </span>
            <span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              Total: $ {{ selectedTotal() | number:'1.2-2' }} ({{ form.clinicalStudyIds.length }} seleccionados)
            </span>
          </div>

          <!-- Study Search & Category Filter -->
          <div class="flex items-center gap-2 mb-2">
            <input
              type="text"
              [(ngModel)]="studySearch"
              class="form-control text-xs py-1"
              placeholder="🔍 Filtrar catálogo de estudios por nombre o código..." />
          </div>

          <!-- Studies Checklist -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/40">
            @for (study of filteredStudies(); track study.id) {
              <label
                class="flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none text-xs"
                [class.bg-blue-50]="isStudySelected(study.id)"
                [class.border-blue-400]="isStudySelected(study.id)"
                [class.dark:bg-blue-950/40]="isStudySelected(study.id)"
                [class.bg-white]="!isStudySelected(study.id)"
                [class.dark:bg-slate-800]="!isStudySelected(study.id)"
                [class.border-slate-200]="!isStudySelected(study.id)"
                [class.dark:border-slate-700]="!isStudySelected(study.id)">
                
                <input
                  type="checkbox"
                  [checked]="isStudySelected(study.id)"
                  (change)="toggleStudy(study.id)"
                  class="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <span class="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {{ study.name }}
                    </span>
                    <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      $ {{ study.basePrice | number:'1.2-2' }}
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span class="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">{{ study.code }}</span>
                    <span>•</span>
                    <span>{{ study.categoryName }}</span>
                    <span>•</span>
                    <span>{{ study.exams.length }} exámenes</span>
                  </div>
                </div>
              </label>
            }
          </div>
        </div>

        <div>
          <label class="form-label font-bold text-xs">Notas Adicionales / Indicaciones de Muestra</label>
          <textarea
            [(ngModel)]="form.notes"
            class="form-control text-xs"
            rows="2"
            placeholder="Comentarios de entrega, indicaciones de ayuno comunicadas al paciente..."></textarea>
        </div>

        <!-- Action Footer -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" class="btn btn-secondary" (click)="close()">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary font-bold"
            [disabled]="saving || !form.patientId || form.clinicalStudyIds.length === 0"
            (click)="save()">
            @if (saving) {
              <span class="spinner-sm mr-1.5"></span>
            }
            Crear Orden ($ {{ selectedTotal() | number:'1.2-2' }})
          </button>
        </div>
      </div>
    </app-modal>
  `
})
export class CreateStudyOrderModalComponent implements OnInit, OnDestroy, OnChanges {
  private readonly http = inject(HttpClient);
  private readonly studyService = inject(ClinicalStudyService);
  private readonly orderService = inject(StudyOrderService);
  private readonly toast = inject(ToastService);

  @Input() isOpen = false;
  @Input() preselectedPatient: PatientDto | null = null;
  @Input() preselectedSpecialistId: string | null = null;
  @Input() schedulingId: string | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() orderCreated = new EventEmitter<StudyOrderDto>();

  readonly searchedPatients = signal<PatientDto[]>([]);
  readonly selectedPatient = signal<PatientDto | null>(null);
  readonly patientDropdownOpen = signal<boolean>(false);
  patientSearchText = '';
  loadingPatients = false;
  private readonly patientSearchSubject = new Subject<string>();
  private searchSub?: Subscription;

  readonly specialists = signal<SpecialistDto[]>([]);
  readonly selectedSpecialist = signal<SpecialistDto | null>(null);
  readonly specialistDropdownOpen = signal<boolean>(false);
  specialistSearchQuery = '';
  specialistSearchChosen = false;

  readonly studies = signal<ClinicalStudyDto[]>([]);
  studySearch = '';
  saving = false;

  form: CreateStudyOrderDto = {
    patientId: '',
    specialistId: null,
    schedulingId: null,
    clinicalDiagnosis: '',
    notes: '',
    clinicalStudyIds: []
  };

  ngOnInit(): void {
    this.setupPatientSearch();
    this.loadSpecialists();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      if (this.preselectedPatient) {
        this.selectedPatient.set(this.preselectedPatient);
        this.form.patientId = this.preselectedPatient.id;
      } else {
        this.triggerPatientSearch('');
      }

      if (this.preselectedSpecialistId) {
        this.form.specialistId = this.preselectedSpecialistId;
        const found = this.specialists().find(s => s.id === this.preselectedSpecialistId);
        if (found) this.selectedSpecialist.set(found);
      }

      if (this.schedulingId) {
        this.form.schedulingId = this.schedulingId;
      }
      this.loadStudies();
    }
  }

  setupPatientSearch(): void {
    this.searchSub = this.patientSearchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        this.loadingPatients = true;
        const url = query.trim()
          ? `${environment.apiUrl}/patients?query=${encodeURIComponent(query.trim())}`
          : `${environment.apiUrl}/patients`;
        return this.http.get<ApiResponse<PatientDto[]>>(url).pipe(
          catchError(() => of({ success: false, message: '', data: [] as PatientDto[], errors: [] }))
        );
      })
    ).subscribe({
      next: (res) => {
        this.loadingPatients = false;
        const list = (res.data || []).map(p => ({
          ...p,
          fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim()
        }));
        this.searchedPatients.set(list);
      },
      error: () => {
        this.loadingPatients = false;
      }
    });
  }

  onPatientSearchInput(query: string): void {
    this.patientSearchText = query;
    this.patientDropdownOpen.set(true);
    this.patientSearchSubject.next(query);
  }

  triggerPatientSearch(query: string): void {
    this.patientSearchSubject.next(query);
  }

  selectPatient(p: PatientDto): void {
    this.selectedPatient.set(p);
    this.form.patientId = p.id;
    this.patientDropdownOpen.set(false);
    this.patientSearchText = '';
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.form.patientId = '';
    this.patientSearchText = '';
    this.triggerPatientSearch('');
  }

  loadSpecialists(): void {
    this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/employees`).subscribe(res => {
      this.specialists.set(res.data || []);
      if (this.preselectedSpecialistId) {
        const found = (res.data || []).find(s => s.id === this.preselectedSpecialistId);
        if (found) this.selectedSpecialist.set(found);
      }
    });
  }

  filteredSpecialists(): SpecialistDto[] {
    const q = this.specialistSearchQuery.trim().toLowerCase();
    if (!q) return this.specialists();
    return this.specialists().filter(s =>
      (s.fullName || `${s.firstName} ${s.lastName}`).toLowerCase().includes(q) ||
      (s.specialtyName || '').toLowerCase().includes(q) ||
      (s.licenseNumber || '').toLowerCase().includes(q)
    );
  }

  selectSpecialist(spec: SpecialistDto | null): void {
    if (spec) {
      this.selectedSpecialist.set(spec);
      this.form.specialistId = spec.id;
      this.specialistSearchChosen = true;
    } else {
      this.chooseReceptionCounter();
    }
    this.specialistDropdownOpen.set(false);
    this.specialistSearchQuery = '';
  }

  chooseReceptionCounter(): void {
    this.selectedSpecialist.set(null);
    this.form.specialistId = null;
    this.specialistSearchChosen = true;
    this.specialistDropdownOpen.set(false);
    this.specialistSearchQuery = '';
  }

  clearSpecialist(): void {
    this.selectedSpecialist.set(null);
    this.form.specialistId = null;
    this.specialistSearchChosen = false;
    this.specialistSearchQuery = '';
  }

  loadStudies(): void {
    this.studyService.getAll(undefined, true).subscribe(res => this.studies.set(res.data || []));
  }

  resetForm(): void {
    this.form = {
      patientId: this.preselectedPatient?.id || '',
      specialistId: this.preselectedSpecialistId || null,
      schedulingId: this.schedulingId || null,
      clinicalDiagnosis: '',
      notes: '',
      clinicalStudyIds: []
    };
    this.selectedPatient.set(this.preselectedPatient || null);
    this.selectedSpecialist.set(null);
    this.specialistSearchChosen = false;
    this.patientSearchText = '';
    this.specialistSearchQuery = '';
    this.studySearch = '';
    this.patientDropdownOpen.set(false);
    this.specialistDropdownOpen.set(false);
  }

  filteredStudies(): ClinicalStudyDto[] {
    let list = this.studies();
    const q = this.studySearch.trim().toLowerCase();
    if (q) {
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }
    return list;
  }

  isStudySelected(id: string): boolean {
    return this.form.clinicalStudyIds.includes(id);
  }

  toggleStudy(id: string): void {
    const idx = this.form.clinicalStudyIds.indexOf(id);
    if (idx >= 0) {
      this.form.clinicalStudyIds.splice(idx, 1);
    } else {
      this.form.clinicalStudyIds.push(id);
    }
  }

  selectedTotal(): number {
    return this.studies()
      .filter(s => this.form.clinicalStudyIds.includes(s.id))
      .reduce((sum, s) => sum + s.basePrice, 0);
  }

  save(): void {
    if (!this.form.patientId) {
      this.toast.error('Debe seleccionar un paciente.');
      return;
    }
    if (this.form.clinicalStudyIds.length === 0) {
      this.toast.error('Debe seleccionar al menos un estudio.');
      return;
    }

    this.saving = true;
    this.orderService.create(this.form).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success && res.data) {
          this.toast.success(`Orden ${res.data.orderNumber} creada exitosamente.`);
          this.orderCreated.emit(res.data);
          this.close();
        } else {
          this.toast.error(res.message || 'Error al crear orden.');
        }
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.message || 'Error al crear orden de estudios.');
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}

