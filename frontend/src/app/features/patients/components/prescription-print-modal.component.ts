import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDto, PrescriptionDto } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-prescription-print-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal 
      [isOpen]="isOpen" 
      title="Vista de Impresión de Receta" 
      size="lg"
      (closed)="close()">
      
      @if (prescription) {
        <div id="printable-rx" class="prescription-sheet">
          <!-- Header Letterhead -->
          <div class="sheet-header">
            <div>
              <h2 class="company-title">{{ companyName || 'MedApp Centro Médico' }}</h2>
              <p class="company-meta">
                <span>NIT: {{ companyTaxId || 'N/A' }}</span> • <span>Tel: {{ companyPhone || 'N/A' }}</span>
              </p>
              @if (companyAddress) {
                <p class="company-meta">{{ companyAddress }}</p>
              }
            </div>
            <div class="sheet-badge-box">
              <span class="sheet-type-label">RECETA MÉDICA</span>
              <span class="sheet-date">{{ prescription.prescriptionDate | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>

          <!-- Patient and Doctor Information -->
          <div class="info-grid">
            <div class="info-box">
              <span class="info-label">Paciente:</span>
              <div class="info-name">
                {{ patient?.fullName || (patient?.firstName ? (patient?.firstName + ' ' + patient?.lastName) : 'Paciente') }}
              </div>
              <div class="info-sub">
                <span>Doc: <b>{{ patient?.documentId || 'N/A' }}</b></span> • <span>Edad: <b>{{ patient?.age ?? 'N/A' }} años</b></span>
              </div>
            </div>
            <div class="info-box">
              <span class="info-label">Médico Tratante:</span>
              <div class="info-name">
                👨‍⚕️ {{ prescription.specialistName || 'Especialista' }}
              </div>
              <div class="info-sub">
                <span>Prescripción Clínica Autorizada</span>
              </div>
            </div>
          </div>

          <!-- Medication List -->
          <div class="rx-section">
            <h3 class="rx-section-title">Rp. Prescripción Farmacológica</h3>
            <table class="rx-table">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dosis</th>
                  <th>Frecuencia</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                @for (item of prescription.items; track item.id || $index) {
                  <tr>
                    <td class="med-name-cell">
                      <div class="med-name">{{ item.medicationName }}</div>
                      @if (item.instructions) {
                        <div class="med-instrux">{{ item.instructions }}</div>
                      }
                    </td>
                    <td>{{ item.dosage }}</td>
                    <td>{{ item.frequency }}</td>
                    <td>{{ item.durationDays }} días</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- General Notes -->
          @if (prescription.notes) {
            <div class="rx-notes-box">
              <span class="notes-label">Indicaciones y Recomendaciones Generales:</span>
              <p class="notes-text">{{ prescription.notes }}</p>
            </div>
          }

          <!-- Signature Footer -->
          <div class="sheet-footer">
            <div class="signature-line">
              <span class="signature-doctor">{{ prescription.specialistName }}</span>
              <span class="signature-title">Firma y Sello Médico</span>
            </div>
          </div>
        </div>
      }

      <div modal-footer class="flex items-center gap-2">
        <button type="button" class="btn btn-secondary" (click)="close()">Cerrar</button>
        <button type="button" class="btn btn-primary" (click)="printDocument()">
          🖨️ Imprimir Receta
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    /* Prescription sheet isolation: explicit dark ink on crisp white paper in both Light & Dark modes */
    .prescription-sheet {
      background-color: #ffffff !important;
      color: #0f172a !important;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    .sheet-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 1rem;
      gap: 1rem;
    }

    .company-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0284c7 !important;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .company-meta {
      font-size: 0.75rem;
      color: #64748b !important;
      margin: 0.25rem 0 0 0;
    }

    .sheet-badge-box {
      text-align: right;
      flex-shrink: 0;
    }

    .sheet-type-label {
      display: block;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b !important;
    }

    .sheet-date {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a !important;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      background-color: #f8fafc !important;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.875rem 1rem;
    }

    .info-box {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .info-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b !important;
      letter-spacing: 0.025em;
    }

    .info-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #0f172a !important;
    }

    .info-sub {
      font-size: 0.75rem;
      color: #475569 !important;
    }

    .rx-section-title {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0369a1 !important;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 0.375rem;
      margin: 0 0 0.75rem 0;
    }

    .rx-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.8125rem;
    }

    .rx-table th {
      background-color: #f1f5f9 !important;
      color: #334155 !important;
      font-weight: 600;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #cbd5e1;
    }

    .rx-table td {
      padding: 0.625rem 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b !important;
      vertical-align: top;
    }

    .med-name-cell {
      max-width: 220px;
    }

    .med-name {
      font-weight: 700;
      color: #0f172a !important;
    }

    .med-instrux {
      font-size: 0.75rem;
      color: #475569 !important;
      font-style: italic;
      margin-top: 0.125rem;
    }

    .rx-notes-box {
      background-color: #f8fafc !important;
      border-left: 3px solid #0284c7;
      padding: 0.75rem 1rem;
      border-radius: 0.25rem;
    }

    .notes-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #0369a1 !important;
      margin-bottom: 0.25rem;
    }

    .notes-text {
      font-size: 0.8125rem;
      color: #334155 !important;
      margin: 0;
      line-height: 1.4;
    }

    .sheet-footer {
      padding-top: 2rem;
      display: flex;
      justify-content: flex-end;
    }

    .signature-line {
      width: 14rem;
      text-align: center;
      border-top: 1px solid #64748b;
      padding-top: 0.5rem;
    }

    .signature-doctor {
      display: block;
      font-size: 0.8125rem;
      font-weight: 700;
      color: #0f172a !important;
    }

    .signature-title {
      display: block;
      font-size: 0.6875rem;
      color: #64748b !important;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Print styles */
    @media print {
      .prescription-sheet {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        width: 100% !important;
      }
    }
  `]
})
export class PrescriptionPrintModalComponent {
  @Input() isOpen = false;
  @Input() prescription: PrescriptionDto | null = null;
  @Input() patient: PatientDto | null = null;
  @Input() companyName: string = '';
  @Input() companyTaxId: string | null = null;
  @Input() companyPhone: string | null = null;
  @Input() companyAddress: string | null = null;

  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  printDocument(): void {
    window.print();
  }
}
