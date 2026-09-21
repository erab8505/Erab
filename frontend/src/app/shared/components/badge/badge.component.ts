import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="['badge', 'badge-' + variant]">
      <span class="badge-dot" [ngClass]="'dot-' + variant"></span>
      <ng-content></ng-content>
      @if (text) {
        <span>{{ text }}</span>
      }
    </span>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.2rem 0.625rem;
      border-radius: var(--radius-full, 9999px);
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
    }
    .badge-primary { background-color: var(--primary-light); color: var(--primary-color); }
    .badge-success { background-color: var(--success-light); color: var(--success-color); }
    .badge-danger { background-color: var(--danger-light); color: var(--danger-color); }
    .badge-warning { background-color: var(--warning-light); color: var(--warning-color); }
    .badge-info { background-color: var(--info-light); color: var(--info-color); }
    .badge-neutral { background-color: var(--bg-hover); color: var(--text-muted); }

    .badge-dot {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 9999px;
      flex-shrink: 0;
    }
    .dot-primary { background-color: var(--primary-color); }
    .dot-success { background-color: var(--success-color); }
    .dot-danger { background-color: var(--danger-color); }
    .dot-warning { background-color: var(--warning-color); }
    .dot-info { background-color: var(--info-color); }
    .dot-neutral { background-color: var(--text-muted); }
  `]
})
export class BadgeComponent {
  @Input() text: string = '';
  @Input() variant: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' = 'neutral';
}
