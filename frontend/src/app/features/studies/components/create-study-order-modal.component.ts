import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ClinicalStudyDto, CreateStudyOrderDto, PatientDto, SpecialistDto, StudyCategory, StudyOrderDto } from '../../../core/models/models';
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
          <div>
            <label class="form-label">Paciente *</label>
            @if (preselectedPatient) {
              <div class="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                <span>👤</span>
                <div>
                  <div>{{ preselectedPatient.firstName }} {{ preselectedPatient.lastName }}</div>
                  <div class="text-[10px] text-slate-400 font-mono">Doc: {{ preselectedPatient.documentId || 'N/A' }}</div>
                </div>
              </div>
            } @else {
              <select [(ngModel)]="form.patientId" class="form-select text-xs font-semibold" required>
                <option value="" disabled selected>-- Seleccione Paciente --</option>
                @for (p of patients(); track p.id) {
                  <option [value]="p.id">
                    {{ p.firstName }} {{ p.lastName }} (Doc: {{ p.documentId || 'N/A' }})
                  </option>
                }
              </select>
            }
          </div>

          <div>
            <label class="form-label">Médico Solicitante (Opcional)</label>
            <select [(ngModel)]="form.specialistId" class="form-select text-xs">
              <option [ngValue]="null">-- Mostrador de Recepción / Sin Médico --</option>
              @for (spec of specialists(); track spec.id) {
                <option [value]="spec.id">
                  👨‍⚕️ {{ spec.fullName || (spec.firstName + ' ' + spec.lastName) }} ({{ spec.specialtyName }})
                </option>
              }
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Diagnóstico Presuntivo / Indicación Clínica</label>
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
              placeholder="🔍 Filtrar estudios por nombre o código..." />
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
          <label class="form-label">Notas Adicionales / Indicaciones de Muestra</label>
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
export class CreateStudyOrderModalComponent implements OnInit, OnChanges {
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

  readonly patients = signal<PatientDto[]>([]);
  readonly specialists = signal<SpecialistDto[]>([]);
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
    this.loadDependencies();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      if (this.preselectedPatient) {
        this.form.patientId = this.preselectedPatient.id;
      }
      if (this.preselectedSpecialistId) {
        this.form.specialistId = this.preselectedSpecialistId;
      }
      if (this.schedulingId) {
        this.form.schedulingId = this.schedulingId;
      }
      this.loadStudies();
    }
  }

  loadDependencies(): void {
    this.http.get<ApiResponse<PatientDto[]>>(`${environment.apiUrl}/patients`).subscribe(res => this.patients.set(res.data || []));
    this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/specialists`).subscribe(res => this.specialists.set(res.data || []));
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
    this.studySearch = '';
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
