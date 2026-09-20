import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="badgeClass" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors">
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass"></span>
      <ng-content></ng-content>
      @if (text) {
        {{ text }}
      }
    </span>
  `,
  styles: [`
    :host { display: inline-block; }
  `]
})
export class BadgeComponent {
  @Input() text: string = '';
  @Input() variant: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' = 'neutral';

  get badgeClass(): string {
    switch (this.variant) {
      case 'primary':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'success':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'danger':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      case 'info':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  }

  get dotClass(): string {
    switch (this.variant) {
      case 'primary': return 'bg-blue-500';
      case 'success': return 'bg-emerald-500';
      case 'danger': return 'bg-rose-500';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-cyan-500';
      default: return 'bg-slate-400';
    }
  }
}
