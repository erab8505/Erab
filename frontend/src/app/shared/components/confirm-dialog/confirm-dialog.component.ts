import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal 
      [isOpen]="isOpen" 
      [title]="title" 
      size="sm"
      (closed)="onCancel()">
      
      <div class="flex items-start gap-4">
        <div class="confirm-icon" [ngClass]="variant">
          @if (variant === 'danger') {
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          } @else {
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        </div>
        <div class="flex-1 text-sm text-slate-600 dark:text-slate-300">
          <p class="m-0 leading-relaxed">{{ message }}</p>
        </div>
      </div>

      <div modal-footer class="flex items-center gap-3">
        <button 
          type="button" 
          class="btn btn-secondary"
          [disabled]="loading"
          (click)="onCancel()">
          {{ cancelText }}
        </button>
        <button 
          type="button" 
          [class]="confirmBtnClass"
          [disabled]="loading"
          (click)="onConfirm()">
          @if (loading) {
            <span class="spinner-sm mr-2"></span>
          }
          {{ confirmText }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .confirm-icon {
      padding: 0.5rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .confirm-icon.danger {
      background-color: #fee2e2;
      color: #dc2626;
    }
    .confirm-icon.warning {
      background-color: #fef3c7;
      color: #d97706;
    }
    .confirm-icon.primary {
      background-color: #e0e7ff;
      color: #4338ca;
    }
    :host-context(.dark) .confirm-icon.danger {
      background-color: rgba(220, 38, 38, 0.2);
      color: #f87171;
    }
    :host-context(.dark) .confirm-icon.warning {
      background-color: rgba(217, 119, 6, 0.2);
      color: #fbbf24;
    }
    :host-context(.dark) .confirm-icon.primary {
      background-color: rgba(67, 56, 202, 0.2);
      color: #818cf8;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Está seguro de que desea continuar?';
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() variant: 'danger' | 'warning' | 'primary' = 'danger';
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get confirmBtnClass(): string {
    switch (this.variant) {
      case 'danger': return 'btn btn-danger';
      case 'warning': return 'btn btn-warning';
      default: return 'btn btn-primary';
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
