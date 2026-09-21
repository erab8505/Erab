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
    if (!this.prescription) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    const patientName = this.patient?.fullName || (this.patient?.firstName ? `${this.patient.firstName} ${this.patient.lastName}` : 'Paciente');
    const patientDoc = this.patient?.documentId || 'N/A';
    const patientAge = this.patient?.age != null ? `${this.patient.age} años` : 'N/A';
    const doctorName = this.prescription.specialistName || 'Especialista';
    const rxDate = this.prescription.prescriptionDate ? new Date(this.prescription.prescriptionDate).toLocaleDateString('es-ES') : '';

    const itemsHtml = (this.prescription.items || []).map(item => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${item.medicationName}</div>
          ${item.instructions ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">${item.instructions}</div>` : ''}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${item.dosage}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${item.frequency}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${item.durationDays} días</td>
      </tr>
    `).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Receta Médica - ${patientName}</title>
          <style>
            @page {
              margin: 15mm;
              size: auto;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: 12px;
              color: #0f172a;
              background: #ffffff;
              padding: 10px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0284c7;
              padding-bottom: 12px;
              margin-bottom: 15px;
            }
            .clinic-title {
              font-size: 18px;
              font-weight: 800;
              color: #0284c7;
            }
            .clinic-meta {
              font-size: 11px;
              color: #475569;
              margin-top: 3px;
            }
            .rx-tag {
              text-align: right;
            }
            .rx-badge {
              display: inline-block;
              background: #0284c7;
              color: white;
              font-weight: 800;
              font-size: 11px;
              padding: 3px 10px;
              border-radius: 4px;
              letter-spacing: 0.5px;
            }
            .rx-date {
              display: block;
              font-size: 11px;
              color: #475569;
              margin-top: 4px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 15px;
            }
            .info-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
            }
            .info-val {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 2px;
            }
            .info-sub {
              font-size: 11px;
              color: #475569;
              margin-top: 2px;
            }
            .rx-title {
              font-size: 13px;
              font-weight: 800;
              color: #0284c7;
              margin-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th {
              background: #f1f5f9;
              text-align: left;
              padding: 8px 10px;
              font-size: 11px;
              font-weight: 700;
              color: #475569;
              border-bottom: 1px solid #cbd5e1;
            }
            .notes-box {
              background: #f8fafc;
              border-left: 3px solid #0284c7;
              padding: 8px 12px;
              margin-bottom: 25px;
            }
            .notes-label {
              font-size: 11px;
              font-weight: 700;
              color: #0284c7;
            }
            .notes-text {
              font-size: 11px;
              color: #334155;
              margin-top: 3px;
            }
            .footer {
              display: flex;
              justify-content: flex-end;
              margin-top: 40px;
              padding-top: 15px;
            }
            .sig-box {
              text-align: center;
              width: 200px;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .sig-doctor {
              font-weight: 700;
              font-size: 12px;
            }
            .sig-label {
              font-size: 10px;
              color: #64748b;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-title">${this.companyName || 'MedApp Centro Médico'}</div>
              <div class="clinic-meta">NIT/RUC: ${this.companyTaxId || 'N/A'} • Tel: ${this.companyPhone || 'N/A'}</div>
              ${this.companyAddress ? `<div class="clinic-meta">${this.companyAddress}</div>` : ''}
            </div>
            <div class="rx-tag">
              <span class="rx-badge">RECETA MÉDICA</span>
              <span class="rx-date">${rxDate}</span>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-label">Paciente:</div>
              <div class="info-val">${patientName}</div>
              <div class="info-sub">Doc: <b>${patientDoc}</b> • Edad: <b>${patientAge}</b></div>
            </div>
            <div>
              <div class="info-label">Médico Tratante:</div>
              <div class="info-val">👨‍⚕️ ${doctorName}</div>
              <div class="info-sub">Prescripción Clínica Autorizada</div>
            </div>
          </div>

          <div class="rx-title">Rp. Prescripción Farmacológica</div>
          <table>
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dosis</th>
                <th>Frecuencia</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${this.prescription.notes ? `
          <div class="notes-box">
            <div class="notes-label">Indicaciones y Recomendaciones Generales:</div>
            <div class="notes-text">${this.prescription.notes}</div>
          </div>` : ''}

          <div class="footer">
            <div class="sig-box">
              <div class="sig-doctor">${doctorName}</div>
              <div class="sig-label">Firma y Sello Médico</div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Error printing prescription:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 200);
  }
}
