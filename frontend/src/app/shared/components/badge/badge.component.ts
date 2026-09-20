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
    .badge-dot {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 9999px;
      flex-shrink: 0;
    }
    .dot-primary { background-color: #2563eb; }
    .dot-success { background-color: #10b981; }
    .dot-danger { background-color: #f43f5e; }
    .dot-warning { background-color: #f59e0b; }
    .dot-info { background-color: #06b6d4; }
    .dot-neutral { background-color: #94a3b8; }

    :host-context(.dark) .dot-primary { background-color: #38bdf8; }
    :host-context(.dark) .dot-success { background-color: #34d399; }
    :host-context(.dark) .dot-danger { background-color: #fb7185; }
    :host-context(.dark) .dot-warning { background-color: #fbbf24; }
    :host-context(.dark) .dot-info { background-color: #2dd4bf; }
    :host-context(.dark) .dot-neutral { background-color: #64748b; }
  `]
})
export class BadgeComponent {
  @Input() text: string = '';
  @Input() variant: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' = 'neutral';
}
