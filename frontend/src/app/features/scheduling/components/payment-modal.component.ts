import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatePaymentDto, PaymentDto, PaymentMethod, PaymentStatus, SchedulingDto } from '../../../core/models/models';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="existingPayment ? 'Detalle de Cobro' : 'Registrar Cobro de Cita'"
      size="md"
      (closed)="close()">

      @if (scheduling) {
        <div class="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1 text-sm">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-900 dark:text-slate-100">{{ scheduling.patientName }}</span>
            <span class="text-xs font-mono bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
              🆔 {{ scheduling.patientDocumentId || scheduling.patientDocument || 'N/A' }}
            </span>
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
            <span>🩺 {{ scheduling.interventionTypeName || scheduling.interventionName || 'Procedimiento' }}</span>
            <span>•</span>
            <span>👨‍⚕️ {{ scheduling.specialistName }}</span>
          </div>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
        <!-- Amount Field -->
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Monto a Cobrar ($) *
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              formControlName="amount"
              class="w-full pl-8 pr-3 py-2 text-lg font-bold border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"
              placeholder="0.00" />
          </div>
          @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
            <p class="text-xs text-red-500 mt-1">El monto debe ser un valor válido mayor o igual a 0.</p>
          }
        </div>

        <!-- Payment Method Selector -->
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Método de Pago *
          </label>
          <div class="grid grid-cols-3 gap-2">
            @for (m of paymentMethods; track m.value) {
              <button
                type="button"
                (click)="setMethod(m.value)"
                class="flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all"
                [class.bg-blue-50]="form.get('method')?.value === m.value"
                [class.border-blue-500]="form.get('method')?.value === m.value"
                [class.text-blue-700]="form.get('method')?.value === m.value"
                [class.dark:bg-blue-950/40]="form.get('method')?.value === m.value"
                [class.dark:text-blue-300]="form.get('method')?.value === m.value"
                [class.border-slate-200]="form.get('method')?.value !== m.value"
                [class.dark:border-slate-700]="form.get('method')?.value !== m.value"
                [class.text-slate-600]="form.get('method')?.value !== m.value"
                [class.dark:text-slate-400]="form.get('method')?.value !== m.value">
                <span class="text-xl mb-1">{{ m.icon }}</span>
                <span>{{ m.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Status & Reference Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Estado de Cobro *
            </label>
            <select
              formControlName="status"
              class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white">
              <option value="Paid">🟢 Pagado (Cobrado)</option>
              <option value="Pending">🟡 Pendiente de Pago</option>
              <option value="Refunded">⚪ Reembolsado</option>
              <option value="Cancelled">🔴 Cancelado</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Ref. / Voucher (Opcional)
            </label>
            <input
              type="text"
              formControlName="transactionReference"
              placeholder="Ej: TRX-98234, SINPE #431"
              class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white" />
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Observaciones o Notas
          </label>
          <textarea
            formControlName="notes"
            rows="2"
            placeholder="Detalles adicionales del cobro..."
            class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"></textarea>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" class="btn btn-secondary" (click)="close()" [disabled]="loading()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
            @if (loading()) {
              <span class="spinner-sm"></span>
              <span class="ml-1">Guardando...</span>
            } @else {
              <span>💾 Guardar Cobro</span>
            }
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class PaymentModalComponent {
  private fb = inject(FormBuilder);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);

  @Input() isOpen = false;
  @Input() scheduling: SchedulingDto | null = null;
  @Input() existingPayment: PaymentDto | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() paymentSaved = new EventEmitter<PaymentDto>();

  loading = signal<boolean>(false);

  paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'Cash', label: 'Efectivo', icon: '💵' },
    { value: 'CreditCard', label: 'Tarj. Crédito', icon: '💳' },
    { value: 'DebitCard', label: 'Tarj. Débito', icon: '🏧' },
    { value: 'BankTransfer', label: 'Transferencia', icon: '🏦' },
    { value: 'ElectronicWallet', label: 'App / SINPE / Zelle', icon: '📱' }
  ];

  form: FormGroup = this.fb.group({
    amount: [50, [Validators.required, Validators.min(0)]],
    method: ['Cash' as PaymentMethod, Validators.required],
    status: ['Paid' as PaymentStatus, Validators.required],
    transactionReference: [''],
    notes: ['']
  });

  ngOnChanges(): void {
    if (this.isOpen) {
      if (this.existingPayment) {
        this.form.patchValue({
          amount: this.existingPayment.amount,
          method: this.existingPayment.method,
          status: this.existingPayment.status,
          transactionReference: this.existingPayment.transactionReference || '',
          notes: this.existingPayment.notes || ''
        });
      } else if (this.scheduling) {
        this.form.patchValue({
          amount: this.scheduling.paymentAmount || 50,
          method: this.scheduling.paymentMethod || 'Cash',
          status: this.scheduling.paymentStatus || 'Paid',
          transactionReference: '',
          notes: ''
        });
      }
    }
  }

  setMethod(method: PaymentMethod): void {
    this.form.patchValue({ method });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.scheduling) return;

    this.loading.set(true);
    const formVal = this.form.value;

    const dto: CreatePaymentDto = {
      schedulingId: this.scheduling.id,
      patientId: this.scheduling.patientId,
      amount: Number(formVal.amount),
      method: formVal.method,
      status: formVal.status,
      transactionReference: formVal.transactionReference || null,
      notes: formVal.notes || null
    };

    this.paymentService.createPayment(dto).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.toast.success(res.message || 'Cobro registrado exitosamente.');
          this.paymentSaved.emit(res.data);
          this.close();
        } else {
          this.toast.error(res.message || 'No se pudo registrar el pago.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message || 'Error al procesar el pago.');
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
