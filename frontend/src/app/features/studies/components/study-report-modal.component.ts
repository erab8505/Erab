import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyOrderDto } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-study-report-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="Informe de Resultados de Estudios Clínicos"
      size="xl"
      (closed)="close()">

      @if (order) {
        <div id="printable-study-report" class="report-container bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <!-- Letterhead Header -->
          <div class="flex items-start justify-between gap-4 pb-4 border-b-2 border-blue-600">
            <div>
              <h2 class="text-xl font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-tight">
                {{ companyName || 'MedApp Centro Médico & Laboratorio' }}
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                <span>NIT/RUC: {{ companyTaxId || 'N/A' }}</span> • <span>Tel: {{ companyPhone || 'N/A' }}</span>
              </p>
              @if (companyAddress) {
                <p class="text-xs text-slate-500">{{ companyAddress }}</p>
              }
            </div>

            <div class="text-right">
              <span class="inline-block bg-blue-700 text-white font-extrabold text-xs px-3 py-1 rounded tracking-wider uppercase">
                INFORME DE LABORATORIO
              </span>
              <span class="block font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                {{ order.orderNumber }}
              </span>
              <span class="block text-[11px] text-slate-500">
                Fecha: {{ order.completedDate || order.orderDate | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </div>
          </div>

          <!-- Patient & Doctor Info Grid -->
          <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 my-4 text-xs">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Paciente:</span>
              <span class="font-bold text-sm text-slate-800 dark:text-slate-100 block">{{ order.patientName }}</span>
              <span class="text-slate-500">Doc: <b>{{ order.patientDocumentId || 'N/A' }}</b> • Tel: <b>{{ order.patientPhone || 'N/A' }}</b></span>
            </div>

            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Médico Solicitante:</span>
              <span class="font-semibold text-slate-800 dark:text-slate-100 block">👨‍⚕️ {{ order.specialistName || 'Solicitud de Laboratorio' }}</span>
              @if (order.clinicalDiagnosis) {
                <span class="text-slate-500 block">Dx Presuntivo: <b>{{ order.clinicalDiagnosis }}</b></span>
              }
            </div>
          </div>

          <!-- Study Results Tables -->
          <div class="space-y-6 my-4">
            @for (item of order.items; track item.id) {
              <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div class="bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 font-bold text-xs text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>🔬 {{ item.studyName }} ({{ item.studyCode }})</span>
                  <span class="text-[10px] font-normal uppercase text-slate-500">{{ item.studyCategoryName }}</span>
                </div>

                <table class="w-full text-xs text-left">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th class="p-2">Analito / Parámetro</th>
                      <th class="p-2 w-36 font-bold">Resultado</th>
                      <th class="p-2 w-24">Unidad</th>
                      <th class="p-2 w-48">Valores de Referencia</th>
                      <th class="p-2">Notas</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    @for (res of item.results; track res.id) {
                      <tr [class.bg-rose-50/40]="res.isOutOfRange" [class.dark:bg-rose-950/20]="res.isOutOfRange">
                        <td class="p-2 font-medium">
                          {{ res.parameterName }}
                        </td>
                        <td class="p-2 font-bold font-mono">
                          @if (res.numericValue != null) {
                            <span [class.text-rose-600]="res.isOutOfRange" [class.font-extrabold]="res.isOutOfRange">
                              {{ res.numericValue }}
                              @if (res.alertLevel === 'High') {
                                <span class="text-[10px] font-bold text-rose-600 ml-1">▲</span>
                              } @else if (res.alertLevel === 'Low') {
                                <span class="text-[10px] font-bold text-blue-600 ml-1">▼</span>
                              }
                            </span>
                          } @else {
                            <span>{{ res.textValue || '—' }}</span>
                          }
                        </td>
                        <td class="p-2 font-mono text-slate-500">{{ res.unit || '-' }}</td>
                        <td class="p-2 text-slate-500 text-[11px]">
                          @if (res.referenceText) {
                            <span>{{ res.referenceText }}</span>
                          } @else if (res.referenceRangeMin != null || res.referenceRangeMax != null) {
                            <span class="font-mono">{{ res.referenceRangeMin ?? '0' }} - {{ res.referenceRangeMax ?? 'N/A' }}</span>
                          } @else {
                            <span>-</span>
                          }
                        </td>
                        <td class="p-2 text-slate-500 text-[11px]">
                          {{ res.interpretation || '-' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Observations Footer -->
          @if (order.notes) {
            <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-blue-600 my-4 text-xs">
              <span class="font-bold text-blue-700 dark:text-blue-400 block mb-0.5">Observaciones Generales / Interpretación:</span>
              <p class="text-slate-700 dark:text-slate-300">{{ order.notes }}</p>
            </div>
          }

          <!-- Signature Section -->
          <div class="flex justify-end pt-8 mt-6">
            <div class="text-center w-56 border-t border-slate-900 dark:border-slate-100 pt-1.5">
              <span class="font-bold text-xs block text-slate-800 dark:text-slate-200">Responsable de Laboratorio</span>
              <span class="text-[10px] text-slate-500 uppercase block">Firma y Sello Clínico</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
          <button type="button" class="btn btn-secondary" (click)="close()">
            Cerrar
          </button>

          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-outline-primary" (click)="shareWhatsApp()">
              <span>📲</span> Compartir WhatsApp
            </button>
            <button type="button" class="btn btn-primary font-bold" (click)="printReport()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Imprimir Informe
            </button>
          </div>
        </div>
      }
    </app-modal>
  `
})
export class StudyReportModalComponent {
  @Input() isOpen = false;
  @Input() order: StudyOrderDto | null = null;
  @Input() companyName: string = '';
  @Input() companyTaxId: string = '';
  @Input() companyPhone: string = '';
  @Input() companyAddress: string = '';
  @Output() closed = new EventEmitter<void>();

  printReport(): void {
    if (!this.order) return;

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

    const orderNum = this.order.orderNumber;
    const patientName = this.order.patientName;
    const patientDoc = this.order.patientDocumentId || 'N/A';
    const doctorName = this.order.specialistName || 'Solicitud de Laboratorio';
    const dateStr = this.order.completedDate ? new Date(this.order.completedDate).toLocaleDateString('es-ES') : new Date(this.order.orderDate).toLocaleDateString('es-ES');

    const itemsTables = (this.order.items || []).map((item: any) => `
      <div style="margin-bottom: 18px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
        <div style="background: #f1f5f9; padding: 6px 10px; font-weight: 800; font-size: 12px; color: #0284c7; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
          <span>${item.studyName} (${item.studyCode})</span>
          <span style="font-size: 10px; color: #64748b; font-weight: normal;">${item.studyCategoryName}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 700;">
              <th style="padding: 6px 10px; text-align: left;">Analito / Parámetro</th>
              <th style="padding: 6px 10px; text-align: left; width: 110px;">Resultado</th>
              <th style="padding: 6px 10px; text-align: left; width: 70px;">Unidad</th>
              <th style="padding: 6px 10px; text-align: left; width: 140px;">Valores de Referencia</th>
              <th style="padding: 6px 10px; text-align: left;">Notas</th>
            </tr>
          </thead>
          <tbody>
            ${(item.results || []).map((res: any) => `
              <tr style="border-bottom: 1px solid #f1f5f9; ${res.isOutOfRange ? 'background: #fff1f2;' : ''}">
                <td style="padding: 5px 10px; font-weight: 600;">${res.parameterName}</td>
                <td style="padding: 5px 10px; font-weight: 800; font-family: monospace; ${res.isOutOfRange ? 'color: #e11d48;' : '#0f172a;'}">
                  ${res.numericValue != null ? res.numericValue : (res.textValue || '—')}
                  ${res.alertLevel === 'High' ? ' ▲ ALTO' : (res.alertLevel === 'Low' ? ' ▼ BAJO' : '')}
                </td>
                <td style="padding: 5px 10px; color: #64748b;">${res.unit || '-'}</td>
                <td style="padding: 5px 10px; color: #475569; font-size: 10.5px;">${res.referenceText || (res.referenceRangeMin != null || res.referenceRangeMax != null ? `${res.referenceRangeMin ?? 0} - ${res.referenceRangeMax ?? 'N/A'}` : '-')}</td>
                <td style="padding: 5px 10px; color: #64748b; font-size: 10.5px;">${res.interpretation || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Informe de Laboratorio - ${orderNum}</title>
          <style>
            @page { margin: 12mm; size: auto; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
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
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .clinic-title { font-size: 17px; font-weight: 800; color: #0284c7; text-transform: uppercase; }
            .clinic-sub { font-size: 11px; color: #475569; margin-top: 2px; }
            .tag-title { font-size: 11px; font-weight: 800; background: #0284c7; color: white; padding: 2px 8px; border-radius: 3px; display: inline-block; }
            .info-box {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 8px 12px;
              margin-bottom: 16px;
              font-size: 11.5px;
            }
            .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .info-val { font-size: 13px; font-weight: 700; color: #0f172a; }
            .footer-sig {
              display: flex;
              justify-content: flex-end;
              margin-top: 35px;
              padding-top: 10px;
            }
            .sig-box {
              text-align: center;
              width: 220px;
              border-top: 1px solid #000;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-title">${this.companyName || 'MedApp Centro Médico & Laboratorio'}</div>
              <div class="clinic-sub">NIT/RUC: ${this.companyTaxId || 'N/A'} • Tel: ${this.companyPhone || 'N/A'}</div>
              ${this.companyAddress ? `<div class="clinic-sub">${this.companyAddress}</div>` : ''}
            </div>
            <div style="text-align: right;">
              <span class="tag-title">INFORME DE LABORATORIO</span>
              <div style="font-family: monospace; font-weight: bold; font-size: 12px; margin-top: 3px;">${orderNum}</div>
              <div style="font-size: 10.5px; color: #64748b;">Fecha: ${dateStr}</div>
            </div>
          </div>

          <div class="info-box">
            <div>
              <div class="info-label">Paciente:</div>
              <div class="info-val">${patientName}</div>
              <div style="color: #475569; font-size: 11px;">Doc: <b>${patientDoc}</b></div>
            </div>
            <div>
              <div class="info-label">Médico Solicitante:</div>
              <div class="info-val">👨‍⚕️ ${doctorName}</div>
              ${this.order.clinicalDiagnosis ? `<div style="color: #475569; font-size: 11px;">Dx: <b>${this.order.clinicalDiagnosis}</b></div>` : ''}
            </div>
          </div>

          <div>
            ${itemsTables}
          </div>

          ${this.order.notes ? `
          <div style="background: #f8fafc; border-left: 3px solid #0284c7; padding: 6px 10px; margin-top: 12px; font-size: 11px;">
            <b>Observaciones Generales:</b> ${this.order.notes}
          </div>` : ''}

          <div class="footer-sig">
            <div class="sig-box">
              <div style="font-weight: 700; font-size: 11px;">Responsable de Laboratorio</div>
              <div style="font-size: 9.5px; color: #64748b;">Firma y Sello Clínico</div>
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
        console.error('Error printing study report:', err);
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

  shareWhatsApp(): void {
    if (!this.order) return;
    const phone = (this.order.patientPhone || '').replace(/\D/g, '');
    const patientName = this.order.patientName;
    const orderNum = this.order.orderNumber;
    const text = encodeURIComponent(`Hola ${patientName}, te compartimos la confirmación de tus resultados de laboratorio (${orderNum}) en ${this.companyName || 'MedApp Centro Médico'}. Ya se encuentran validados y listos en tu expediente.`);
    
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  }

  close(): void {
    this.closed.emit();
  }
}
