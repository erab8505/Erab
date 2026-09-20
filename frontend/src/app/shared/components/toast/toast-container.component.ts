import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastMessage, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="toast.type">
          <!-- Icon -->
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              }
              @case ('info') {
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>

          <!-- Close -->
          <button 
            type="button" 
            class="toast-close-btn" 
            (click)="toastService.remove(toast.id)"
            aria-label="Cerrar notificación">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 24rem;
      width: calc(100vw - 3rem);
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 0.5rem;
      background: var(--card-bg, #ffffff);
      color: var(--text-color, #0f172a);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #94a3b8;
      animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border-top: 1px solid var(--border-color, #e2e8f0);
      border-right: 1px solid var(--border-color, #e2e8f0);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .toast-item.success { border-left-color: #10b981; }
    .toast-item.error { border-left-color: #ef4444; }
    .toast-item.warning { border-left-color: #f59e0b; }
    .toast-item.info { border-left-color: #3b82f6; }

    .toast-icon {
      flex-shrink: 0;
      margin-top: 0.125rem;
    }
    .toast-content {
      flex: 1;
    }
    .toast-title {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.125rem;
    }
    .toast-message {
      font-size: 0.8125rem;
      color: var(--text-muted, #475569);
      line-height: 1.35;
    }
    .toast-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      padding: 0.125rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toast-close-btn:hover {
      color: var(--text-color, #0f172a);
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
