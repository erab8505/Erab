import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, MedicalRecordDto, PatientDto, PrescriptionDto, SchedulingDto, SpecialistDto } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { CompanyContextService } from '../../core/services/company-context.service';
import { ToastService } from '../../core/services/toast.service';
import { PatientInfoTabComponent } from './components/patient-info-tab.component';
import { PatientAppointmentsTabComponent } from './components/patient-appointments-tab.component';
import { PatientRecordsTabComponent } from './components/patient-records-tab.component';
import { MedicalRecordModalComponent } from './components/medical-record-modal.component';
import { PatientPrescriptionsTabComponent } from './components/patient-prescriptions-tab.component';
import { PrescriptionModalComponent } from './components/prescription-modal.component';
import { PrescriptionPrintModalComponent } from './components/prescription-print-modal.component';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PatientInfoTabComponent,
    PatientAppointmentsTabComponent,
    PatientRecordsTabComponent,
    MedicalRecordModalComponent,
    PatientPrescriptionsTabComponent,
    PrescriptionModalComponent,
    PrescriptionPrintModalComponent
  ],
  template: `
    <div class="page-container">
      <!-- Top Navigation & Header -->
      <div class="page-header">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <a routerLink="/patients" class="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              &larr; Volver al Directorio de Pacientes
            </a>
          </div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ patient()?.fullName || (patient()?.firstName ? (patient()?.firstName + ' ' + patient()?.lastName) : 'Cargando Paciente...') }}
            </h1>
            @if (patient()?.bloodType) {
              <span class="text-xs bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 font-bold px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                🩸 {{ patient()?.bloodType }}
              </span>
            }
          </div>
          <p class="text-slate-500 text-sm mt-1 flex items-center gap-2 flex-wrap">
            <span class="doc-pill">
              🆔 Doc: {{ patient()?.documentId }}
            </span>
            <span>•</span>
            <span>Edad: <b class="text-slate-700 dark:text-slate-300">{{ patient()?.age }} años</b></span>
            <span>•</span>
            <span>Tel: <b class="text-slate-700 dark:text-slate-300">{{ patient()?.phone || 'N/A' }}</b></span>
          </p>
        </div>

        <div class="header-actions">
          <a [routerLink]="['/scheduling/new']" [queryParams]="{ patientId: patientId() }" class="btn btn-primary">
            🗓️ Agendar Cita
          </a>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'info'" (click)="setTab('info')">
          📋 Datos Personales
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'appointments'" (click)="setTab('appointments')">
          🗓️ Citas ({{ appointments().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'records'" (click)="setTab('records')">
          🩺 Historia Clínica ({{ medicalRecords().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'prescriptions'" (click)="setTab('prescriptions')">
          💊 Recetas y Fórmulas ({{ prescriptions().length }})
        </button>
      </div>

      <!-- TAB 1: DATOS PERSONALES -->
      @if (activeTab() === 'info') {
        <app-patient-info-tab [patient]="patient()"></app-patient-info-tab>
      }

      <!-- TAB 2: CITAS / SCHEDULING -->
      @if (activeTab() === 'appointments') {
        <app-patient-appointments-tab 
          [appointments]="appointments()" 
          [patientId]="patientId()">
        </app-patient-appointments-tab>
      }

      <!-- TAB 3: NOTAS MÉDICAS / HISTORIA CLÍNICA -->
      @if (activeTab() === 'records') {
        <app-patient-records-tab 
          [medicalRecords]="medicalRecords()" 
          [canCreate]="canCreateClinical()"
          (openCreateRecord)="openCreateRecordModal()">
        </app-patient-records-tab>
      }

      <!-- TAB 4: RECETAS / PRESCRIPCIONES -->
      @if (activeTab() === 'prescriptions') {
        <app-patient-prescriptions-tab 
          [prescriptions]="prescriptions()" 
          [canCreate]="canCreateClinical()"
          (openCreatePrescription)="openCreatePrescriptionModal()"
          (openPrint)="openPrintModal($event)">
        </app-patient-prescriptions-tab>
      }

      <!-- MODAL CREAR CONSULTA MÉDICA -->
      <app-medical-record-modal 
        [isOpen]="recordModalOpen()" 
        [specialists]="specialists()"
        [defaultSpecialistId]="authService.specialistId()"
        [saving]="savingRecord()"
        (closed)="closeRecordModal()"
        (save)="saveRecord($event)">
      </app-medical-record-modal>

      <!-- MODAL CREAR RECETA MÉDICA -->
      <app-prescription-modal 
        [isOpen]="prescriptionModalOpen()" 
        [specialists]="specialists()"
        [defaultSpecialistId]="authService.specialistId()"
        [saving]="savingRx()"
        (closed)="closePrescriptionModal()"
        (save)="savePrescription($event)">
      </app-prescription-modal>

      <!-- PRINT MODAL / PREVIEW -->
      <app-prescription-print-modal 
        [isOpen]="printModalOpen()" 
        [prescription]="selectedRxForPrint()"
        [patient]="patient()"
        [companyName]="companyContext.activeCompanyName()"
        [companyTaxId]="companyContext.activeCompany()?.taxId ?? null"
        [companyPhone]="companyContext.activeCompany()?.phone ?? null"
        [companyAddress]="companyContext.activeCompany()?.address ?? null"
        (closed)="closePrintModal()">
      </app-prescription-print-modal>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .tab-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      overflow-x: auto;
    }
    .tab-btn {
      padding: 0.625rem 1rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--text-color, #0f172a);
    }
    .tab-btn.active {
      color: var(--primary-color, #0284c7);
      border-bottom-color: var(--primary-color, #0284c7);
      font-weight: 600;
    }
  `]
})
export class PatientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  readonly authService = inject(AuthService);
  readonly companyContext = inject(CompanyContextService);
  private readonly toast = inject(ToastService);

  readonly patientId = signal<string>('');
  readonly patient = signal<PatientDto | null>(null);
  readonly appointments = signal<SchedulingDto[]>([]);
  readonly medicalRecords = signal<MedicalRecordDto[]>([]);
  readonly prescriptions = signal<PrescriptionDto[]>([]);
  readonly specialists = signal<SpecialistDto[]>([]);

  readonly activeTab = signal<'info' | 'appointments' | 'records' | 'prescriptions'>('info');

  readonly recordModalOpen = signal<boolean>(false);
  readonly savingRecord = signal<boolean>(false);

  readonly prescriptionModalOpen = signal<boolean>(false);
  readonly savingRx = signal<boolean>(false);

  readonly printModalOpen = signal<boolean>(false);
  readonly selectedRxForPrint = signal<PrescriptionDto | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.patientId.set(id);
      this.loadAllData(id);
    }
  }

  loadAllData(id: string): void {
    forkJoin({
      patient: this.http.get<ApiResponse<PatientDto>>(`${environment.apiUrl}/patients/${id}`),
      appointments: this.http.get<ApiResponse<SchedulingDto[]>>(`${environment.apiUrl}/scheduling?patientId=${id}`),
      records: this.http.get<ApiResponse<MedicalRecordDto[]>>(`${environment.apiUrl}/medical-records?patientId=${id}`),
      prescriptions: this.http.get<ApiResponse<PrescriptionDto[]>>(`${environment.apiUrl}/prescriptions?patientId=${id}`),
      specialists: this.http.get<ApiResponse<SpecialistDto[]>>(`${environment.apiUrl}/specialists`)
    }).subscribe({
      next: (res) => {
        const pat = res.patient.data;
        if (pat) {
          pat.fullName = pat.fullName || `${pat.firstName || ''} ${pat.lastName || ''}`.trim();
        }
        this.patient.set(pat);
        this.appointments.set(res.appointments.data || []);
        this.medicalRecords.set(res.records.data || []);
        this.prescriptions.set(res.prescriptions.data || []);
        this.specialists.set(res.specialists.data || []);
      }
    });
  }

  setTab(tab: 'info' | 'appointments' | 'records' | 'prescriptions'): void {
    this.activeTab.set(tab);
  }

  canCreateClinical(): boolean {
    return this.authService.isAdmin() || this.authService.isSpecialist();
  }

  openCreateRecordModal(): void {
    this.recordModalOpen.set(true);
  }

  closeRecordModal(): void {
    this.recordModalOpen.set(false);
  }

  saveRecord(formValue: any): void {
    this.savingRecord.set(true);
    const payload = {
      patientId: this.patientId(),
      interventionTypeId: formValue.interventionTypeId || null,
      recordDate: formValue.recordDate ? new Date(formValue.recordDate).toISOString() : new Date().toISOString(),
      diagnosis: formValue.diagnosis,
      treatment: formValue.treatment || null,
      notes: formValue.notes || null,
      systolicBP: formValue.systolicBP ? Number(formValue.systolicBP) : null,
      diastolicBP: formValue.diastolicBP ? Number(formValue.diastolicBP) : null,
      heartRateBpm: formValue.heartRateBpm ? Number(formValue.heartRateBpm) : null,
      temperatureCelsius: formValue.temperatureCelsius ? Number(formValue.temperatureCelsius) : null,
      oxygenSaturation: formValue.oxygenSaturation ? Number(formValue.oxygenSaturation) : null,
      weightKg: formValue.weightKg ? Number(formValue.weightKg) : null,
      heightCm: formValue.heightCm ? Number(formValue.heightCm) : null
    };

    this.http.post<ApiResponse<MedicalRecordDto>>(`${environment.apiUrl}/medical-records`, payload).subscribe({
      next: () => {
        this.savingRecord.set(false);
        this.toast.success('Atención clínica registrada exitosamente.');
        this.closeRecordModal();
        this.loadAllData(this.patientId());
      },
      error: () => this.savingRecord.set(false)
    });
  }

  openCreatePrescriptionModal(): void {
    this.prescriptionModalOpen.set(true);
  }

  closePrescriptionModal(): void {
    this.prescriptionModalOpen.set(false);
  }

  savePrescription(formValue: any): void {
    this.savingRx.set(true);
    const payload = {
      patientId: this.patientId(),
      specialistId: formValue.specialistId,
      prescriptionDate: new Date(formValue.prescriptionDate).toISOString(),
      notes: formValue.notes || null,
      items: formValue.items
    };

    this.http.post<ApiResponse<PrescriptionDto>>(`${environment.apiUrl}/prescriptions`, payload).subscribe({
      next: () => {
        this.savingRx.set(false);
        this.toast.success('Receta médica emitida exitosamente.');
        this.closePrescriptionModal();
        this.loadAllData(this.patientId());
      },
      error: () => this.savingRx.set(false)
    });
  }

  openPrintModal(rx: PrescriptionDto): void {
    this.selectedRxForPrint.set(rx);
    this.printModalOpen.set(true);
  }

  closePrintModal(): void {
    this.printModalOpen.set(false);
    this.selectedRxForPrint.set(null);
  }
}
