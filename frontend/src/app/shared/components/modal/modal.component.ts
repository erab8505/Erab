import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div 
        class="modal-backdrop"
        [style.zIndex]="zIndex ?? null"
        (click)="onBackdropClick($event)"
        role="dialog"
        [attr.aria-label]="title"
        aria-modal="true">
        <div class="modal-card" [ngClass]="sizeClass" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ title }}</h3>
              @if (subtitle) {
                <p class="modal-subtitle">{{ subtitle }}</p>
              }
            </div>
            <button 
              type="button" 
              class="modal-close-btn"
              (click)="close()"
              aria-label="Cerrar modal">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <ng-content></ng-content>
          </div>

          <!-- Footer -->
          @if (showFooter) {
            <div class="modal-footer">
              <ng-content select="[modal-footer]"></ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      overflow-y: auto;
    }
    .modal-card {
      background-color: var(--card-bg, #ffffff);
      color: var(--text-color, #0f172a);
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .size-sm { max-width: 24rem; }
    .size-md { max-width: 32rem; }
    .size-lg { max-width: 48rem; }
    .size-xl { max-width: 64rem; }
    .size-full { max-width: 95vw; height: 90vh; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .modal-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }
    .modal-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      margin: 0.25rem 0 0 0;
    }
    .modal-close-btn {
      color: var(--text-muted, #64748b);
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-close-btn:hover {
      background-color: var(--bg-hover, #f1f5f9);
      color: var(--text-color, #0f172a);
    }
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background-color: var(--card-footer-bg, #f8fafc);
      border-bottom-left-radius: 0.75rem;
      border-bottom-right-radius: 0.75rem;
    }
    @media print {
      .modal-backdrop {
        position: static !important;
        background: transparent !important;
        backdrop-filter: none !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
        overflow: visible !important;
        width: 100% !important;
        height: auto !important;
        inset: auto !important;
      }
      .modal-card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        max-height: none !important;
        background: transparent !important;
      }
      .modal-header,
      .modal-footer,
      .modal-close-btn {
        display: none !important;
      }
      .modal-body {
        padding: 0 !important;
        overflow: visible !important;
      }
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;
  @Input() zIndex?: number;

  @Output() closed = new EventEmitter<void>();

  get sizeClass(): string {
    return `size-${this.size}`;
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }
}
