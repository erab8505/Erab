import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDto, SchedulingDto } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-payment-receipt-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="Comprobante de Pago / Recibo"
      size="md"
      (closed)="close()">

      @if (payment) {
        <div id="printable-receipt" class="receipt-card">
          <!-- Receipt Header -->
          <div class="receipt-header">
            <div class="clinic-info">
              <h2 class="clinic-name">{{ companyName || 'MedApp Centro Médico' }}</h2>
              <p class="clinic-sub">NIT/RUC: {{ companyTaxId || 'N/A' }} • Tel: {{ companyPhone || 'N/A' }}</p>
              @if (companyAddress) {
                <p class="clinic-sub">{{ companyAddress }}</p>
              }
            </div>
            <div class="receipt-number-tag">
              <span class="tag-title">RECIBO DE CAJA</span>
              <span class="tag-num font-mono">{{ payment.invoiceOrReceiptNumber || ('REC-' + (payment.id | slice:0:8).toUpperCase()) }}</span>
            </div>
          </div>

          <div class="receipt-divider"></div>

          <!-- Transaction Details -->
          <div class="receipt-info-grid">
            <div class="info-row">
              <span class="label">Fecha / Hora:</span>
              <span class="value font-mono">{{ (payment.paidAt || payment.createdAt) | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Paciente:</span>
              <span class="value font-bold">{{ payment.patientName || scheduling?.patientName || 'Paciente' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Documento:</span>
              <span class="value font-mono">{{ payment.patientDocumentId || scheduling?.patientDocumentId || scheduling?.patientDocument || 'N/A' }}</span>
            </div>
            @if (scheduling) {
              <div class="info-row">
                <span class="label">Atención Médica:</span>
                <span class="value">{{ scheduling.interventionTypeName || scheduling.interventionName || 'Consulta / Procedimiento' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Especialista:</span>
                <span class="value">👨‍⚕️ {{ scheduling.specialistName }}</span>
              </div>
            }
            <div class="info-row">
              <span class="label">Método de Pago:</span>
              <span class="value font-semibold flex items-center gap-1">
                <span>{{ getMethodIcon(payment.method) }}</span>
                <span>{{ getMethodLabel(payment.method) }}</span>
              </span>
            </div>
            @if (payment.transactionReference) {
              <div class="info-row">
                <span class="label">Referencia / TRX:</span>
                <span class="value font-mono">{{ payment.transactionReference }}</span>
              </div>
            }
            <div class="info-row">
              <span class="label">Estado:</span>
              <span class="value">
                <span class="status-pill" [class.paid]="payment.status === 'Paid'" [class.pending]="payment.status === 'Pending'">
                  {{ payment.status === 'Paid' ? '✓ PAGADO / COBRADO' : (payment.status === 'Pending' ? '⏳ PENDIENTE' : payment.status) }}
                </span>
              </span>
            </div>
          </div>

          <div class="receipt-divider"></div>

          <!-- Total Block -->
          <div class="receipt-total-box">
            <span class="total-label">TOTAL COBRADO</span>
            <span class="total-amount font-mono">$ {{ payment.amount | number:'1.2-2' }}</span>
          </div>

          @if (payment.notes) {
            <div class="receipt-notes">
              <span class="notes-title">Observaciones:</span>
              <p class="notes-text">{{ payment.notes }}</p>
            </div>
          }

          <div class="receipt-footer">
            <p>¡Gracias por su preferencia!</p>
            <p class="footer-legal">Documento de control administrativo interno y comprobante de atención.</p>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="modal-footer-actions">
          <button type="button" class="btn btn-secondary" (click)="close()">
            Cerrar
          </button>
          <button type="button" class="btn btn-primary" (click)="printReceipt()">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Imprimir Recibo (Ticket)
          </button>
        </div>
      }
    </app-modal>
  `,
  styles: [`
    .receipt-card {
      background: white;
      color: #0f172a;
      padding: 1.5rem;
      border-radius: 0.75rem;
      border: 1px dashed #cbd5e1;
      font-family: inherit;
    }
    :host-context(.dark) .receipt-card {
      background: #1e293b;
      color: #f8fafc;
      border-color: #334155;
    }
    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .clinic-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--primary-color, #0284c7);
      margin: 0;
    }
    .clinic-sub {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.2rem 0 0 0;
    }
    :host-context(.dark) .clinic-sub {
      color: #94a3b8;
    }
    .receipt-number-tag {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .tag-title {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .tag-num {
      font-size: 0.85rem;
      font-weight: 700;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 0.15rem 0.5rem;
      border-radius: 0.375rem;
      margin-top: 0.25rem;
    }
    .receipt-divider {
      height: 1px;
      border-top: 1px dashed #cbd5e1;
      margin: 1rem 0;
    }
    :host-context(.dark) .receipt-divider {
      border-top-color: #334155;
    }
    .receipt-info-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.825rem;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .info-row .label {
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 500;
    }
    :host-context(.dark) .info-row .label {
      color: #94a3b8;
    }
    .info-row .value {
      font-size: 0.825rem;
      text-align: right;
    }
    .status-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }
    .status-pill.paid {
      background: #dcfce7;
      color: #15803d;
    }
    .status-pill.pending {
      background: #fef3c7;
      color: #b45309;
    }
    .receipt-total-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    :host-context(.dark) .receipt-total-box {
      background: #0f172a;
      border-color: #334155;
    }
    .total-label {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #475569;
    }
    :host-context(.dark) .total-label {
      color: #94a3b8;
    }
    .total-amount {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary-color, #0284c7);
    }
    .receipt-notes {
      margin-top: 0.75rem;
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
    }
    :host-context(.dark) .receipt-notes {
      background: #0f172a;
    }
    .notes-title {
      font-weight: 700;
      color: #475569;
    }
    :host-context(.dark) .notes-title {
      color: #94a3b8;
    }
    .notes-text {
      margin: 0.25rem 0 0 0;
      color: #334155;
    }
    :host-context(.dark) .notes-text {
      color: #cbd5e1;
    }
    .receipt-footer {
      text-align: center;
      margin-top: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }
    .footer-legal {
      font-size: 0.65rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    :host-context(.dark) .modal-footer-actions {
      border-top-color: #334155;
    }
  `]
})
export class PaymentReceiptModalComponent {
  @Input() isOpen = false;
  @Input() payment: PaymentDto | null = null;
  @Input() scheduling: SchedulingDto | null = null;
  @Input() companyName: string = '';
  @Input() companyTaxId: string = '';
  @Input() companyPhone: string = '';
  @Input() companyAddress: string = '';
  @Output() closed = new EventEmitter<void>();

  getMethodLabel(method?: string): string {
    switch (method) {
      case 'Cash': return 'Efectivo';
      case 'CreditCard': return 'Tarjeta de Crédito';
      case 'DebitCard': return 'Tarjeta de Débito';
      case 'BankTransfer': return 'Transferencia Bancaria';
      case 'ElectronicWallet': return 'App Móvil / SINPE / Zelle / Bizum';
      default: return method || 'Efectivo';
    }
  }

  getMethodIcon(method?: string): string {
    switch (method) {
      case 'Cash': return '💵';
      case 'CreditCard': return '💳';
      case 'DebitCard': return '🏧';
      case 'BankTransfer': return '🏦';
      case 'ElectronicWallet': return '📱';
      default: return '💵';
    }
  }

  formatDate(dateVal?: string | Date | null): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  printReceipt(): void {
    if (!this.payment) return;

    // Create an isolated printing iframe
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

    const receiptNum = this.payment.invoiceOrReceiptNumber || ('REC-' + (this.payment.id || '').slice(0, 8).toUpperCase());
    const dateFormatted = this.formatDate(this.payment.paidAt || this.payment.createdAt);
    const patientName = this.payment.patientName || this.scheduling?.patientName || 'Paciente';
    const patientDoc = this.payment.patientDocumentId || this.scheduling?.patientDocumentId || this.scheduling?.patientDocument || 'N/A';
    const interventionName = this.scheduling?.interventionTypeName || this.scheduling?.interventionName || 'Consulta Médica / Procedimiento';
    const specialistName = this.scheduling?.specialistName || '';
    const paymentMethod = this.getMethodLabel(this.payment.method);
    const amountFormatted = Number(this.payment.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const statusLabel = this.payment.status === 'Paid' ? '✓ PAGADO / COBRADO' : (this.payment.status === 'Pending' ? '⏳ PENDIENTE' : (this.payment.status || ''));

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Recibo de Pago - ${receiptNum}</title>
          <style>
            @page {
              margin: 0;
              size: 80mm auto;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: 11px;
              line-height: 1.35;
              color: #000000;
              background: #ffffff;
              width: 74mm;
              margin: 0 auto;
              padding: 5mm 3mm;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
            .clinic-name {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .clinic-sub {
              font-size: 10px;
              color: #222222;
              margin-bottom: 1px;
            }
            .tag-title {
              display: inline-block;
              font-size: 10px;
              font-weight: 800;
              border: 1px solid #000000;
              padding: 2px 8px;
              margin-top: 5px;
              margin-bottom: 2px;
              letter-spacing: 0.5px;
            }
            .tag-num {
              font-size: 11px;
              font-weight: 700;
              display: block;
            }
            .divider {
              border-top: 1px dashed #000000;
              margin: 6px 0;
            }
            .divider-double {
              border-top: 2px solid #000000;
              margin: 6px 0;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10.5px;
              margin: 4px 0;
            }
            .info-table td {
              padding: 2px 0;
              vertical-align: top;
            }
            .info-table .label {
              color: #333333;
              width: 40%;
            }
            .info-table .val {
              font-weight: 600;
              text-align: right;
            }
            .total-box {
              border: 1.5px solid #000000;
              padding: 6px 8px;
              margin: 7px 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 11px;
              font-weight: 800;
            }
            .total-amount {
              font-size: 14px;
              font-weight: 900;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
            .notes-box {
              background: #f8f8f8;
              border: 1px dashed #888888;
              padding: 4px 6px;
              margin: 6px 0;
              font-size: 9.5px;
            }
            .footer-text {
              margin-top: 8px;
              font-size: 9.5px;
              color: #333333;
              text-align: center;
            }
            .legal-text {
              font-size: 8px;
              color: #555555;
              margin-top: 3px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="clinic-name">${this.companyName || 'MedApp Centro Médico'}</div>
            <div class="clinic-sub">NIT/RUC: ${this.companyTaxId || 'N/A'} • Tel: ${this.companyPhone || 'N/A'}</div>
            ${this.companyAddress ? `<div class="clinic-sub">${this.companyAddress}</div>` : ''}
            <div>
              <span class="tag-title">RECIBO DE CAJA</span>
              <span class="tag-num font-mono">${receiptNum}</span>
            </div>
          </div>

          <div class="divider"></div>

          <table class="info-table">
            <tr>
              <td class="label">Fecha / Hora:</td>
              <td class="val font-mono">${dateFormatted}</td>
            </tr>
            <tr>
              <td class="label">Paciente:</td>
              <td class="val font-bold">${patientName}</td>
            </tr>
            <tr>
              <td class="label">Documento:</td>
              <td class="val font-mono">${patientDoc}</td>
            </tr>
            ${this.scheduling ? `
            <tr>
              <td class="label">Atención:</td>
              <td class="val">${interventionName}</td>
            </tr>
            ${specialistName ? `
            <tr>
              <td class="label">Especialista:</td>
              <td class="val">${specialistName}</td>
            </tr>` : ''}` : ''}
            <tr>
              <td class="label">Método Pago:</td>
              <td class="val">${paymentMethod}</td>
            </tr>
            ${this.payment.transactionReference ? `
            <tr>
              <td class="label">Referencia / TRX:</td>
              <td class="val font-mono">${this.payment.transactionReference}</td>
            </tr>` : ''}
            <tr>
              <td class="label">Estado:</td>
              <td class="val font-bold">${statusLabel}</td>
            </tr>
          </table>

          <div class="divider-double"></div>

          <div class="total-box">
            <span class="total-label">TOTAL COBRADO</span>
            <span class="total-amount">$ ${amountFormatted}</span>
          </div>

          ${this.payment.notes ? `
          <div class="notes-box">
            <b>Observaciones:</b> ${this.payment.notes}
          </div>` : ''}

          <div class="divider"></div>

          <div class="footer-text">
            <p>¡Gracias por su preferencia!</p>
            <p class="legal-text">Documento de control administrativo interno y comprobante de atención.</p>
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Give the browser time to render document before invoking print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Error printing receipt via iframe:', err);
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

  close(): void {
    this.closed.emit();
  }
}

