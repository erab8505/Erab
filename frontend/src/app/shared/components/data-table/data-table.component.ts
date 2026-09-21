import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="data-table-container">
      <!-- Toolbar -->
      <div class="table-toolbar">
        <div class="search-box">
          <svg class="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="text" 
            class="search-input" 
            [placeholder]="placeholder"
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearchChange($event)"
            aria-label="Buscar en tabla" />
          @if (searchTerm()) {
            <button class="clear-search-btn" (click)="clearSearch()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          }
        </div>

        <div class="toolbar-actions">
          <ng-content select="[table-actions]"></ng-content>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              @for (col of columns; track col.key) {
                <th 
                  [style.width]="col.width || 'auto'"
                  [style.text-align]="col.align || 'left'"
                  [class.cursor-pointer]="col.sortable"
                  (click)="onSort(col)">
                  <div class="th-content" [style.justify-content]="col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start'">
                    <span>{{ col.label }}</span>
                    @if (col.sortable) {
                      <span class="sort-indicator">
                        @if (sortKey() === col.key) {
                          {{ sortDirection() === 'asc' ? '▲' : '▼' }}
                        } @else {
                          <span class="text-slate-300 dark:text-slate-600">↕</span>
                        }
                      </span>
                    }
                  </div>
                </th>
              }
              @if (actionTemplate) {
                <th style="width: 120px; text-align: right;">Acciones</th>
              }
            </tr>
          </thead>
          <tbody>
            @if (loading) {
              <tr>
                <td [attr.colspan]="columns.length + (actionTemplate ? 1 : 0)" class="text-center py-8">
                  <div class="flex items-center justify-center gap-2 text-slate-500">
                    <span class="spinner-sm"></span>
                    <span>Cargando datos...</span>
                  </div>
                </td>
              </tr>
            } @else if (paginatedData().length === 0) {
              <tr>
                <td [attr.colspan]="columns.length + (actionTemplate ? 1 : 0)" class="text-center py-8">
                  <div class="empty-state">
                    <svg class="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                    </svg>
                    <p class="text-slate-500 dark:text-slate-400 font-medium m-0">{{ emptyText }}</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (item of paginatedData(); track item['id'] || $index) {
                <tr>
                  @for (col of columns; track col.key) {
                    <td [style.text-align]="col.align || 'left'">
                      @if (cellTemplate) {
                        <ng-container *ngTemplateOutlet="cellTemplate; context: { $implicit: item, column: col }"></ng-container>
                      } @else {
                        {{ getNestedValue(item, col.key) }}
                      }
                    </td>
                  }
                  @if (actionTemplate) {
                    <td class="text-right">
                      <ng-container *ngTemplateOutlet="actionTemplate; context: { $implicit: item }"></ng-container>
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      @if (!loading && filteredData().length > 0) {
        <div class="table-pagination">
          <div class="pagination-info">
            Mostrando <b>{{ startIndex() + 1 }}</b> - <b>{{ endIndex() }}</b> de <b>{{ filteredData().length }}</b> registros
          </div>
          <div class="pagination-controls">
            <button 
              type="button" 
              class="pagination-btn"
              [disabled]="currentPage() === 1"
              (click)="setPage(currentPage() - 1)">
              Anterior
            </button>
            <span class="pagination-page-indicator">
              Página {{ currentPage() }} de {{ totalPages() }}
            </span>
            <button 
              type="button" 
              class="pagination-btn"
              [disabled]="currentPage() >= totalPages()"
              (click)="setPage(currentPage() + 1)">
              Siguiente
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .data-table-container {
      background: var(--card-bg, #ffffff);
      border-radius: 0.75rem;
      border: 1px solid var(--border-color, #e2e8f0);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .table-toolbar {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      flex-wrap: wrap;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 260px;
      max-width: 400px;
      flex: 1;
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: var(--text-muted, #94a3b8);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 0.5rem 2rem 0.5rem 2.25rem;
      font-size: 0.875rem;
      border: 1px solid var(--border-input, #cbd5e1);
      border-radius: 0.5rem;
      background: var(--bg-input, #ffffff);
      color: var(--text-color, #0f172a);
      outline: none;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    .search-input:focus {
      border-color: var(--primary-color, #0284c7);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }
    .clear-search-btn {
      position: absolute;
      right: 0.5rem;
      background: transparent;
      border: none;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.25rem;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .table-wrapper {
      overflow-x: auto;
      width: 100%;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    .data-table th {
      background-color: var(--table-th-bg, #f8fafc);
      color: var(--text-muted, #64748b);
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      user-select: none;
    }
    .th-content {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .data-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-color, #334155);
    }
    .data-table tbody tr:hover {
      background-color: var(--table-row-hover, #f8fafc);
    }
    .table-pagination {
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-color, #e2e8f0);
      background-color: var(--table-th-bg, #f8fafc);
      font-size: 0.875rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .pagination-info {
      color: var(--text-muted, #64748b);
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .pagination-btn {
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border-input, #cbd5e1);
      border-radius: 0.375rem;
      background: var(--card-bg, #ffffff);
      color: var(--text-color, #334155);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.15s ease;
    }
    .pagination-btn:hover:not(:disabled) {
      background: var(--bg-hover, #f1f5f9);
      border-color: var(--text-muted, #94a3b8);
    }
    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .pagination-page-indicator {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      margin: 0 0.5rem;
    }
  `]
})
export class DataTableComponent<T extends Record<string, any>> {
  @Input() set data(value: T[]) {
    this.rawItems.set(value || []);
    this.currentPage.set(1);
  }
  @Input() columns: TableColumn<T>[] = [];
  @Input() placeholder = 'Buscar...';
  @Input() emptyText = 'No se encontraron registros.';
  @Input() loading = false;
  @Input() pageSize = 10;
  @Input() serverSide = false;

  @Output() searchChange = new EventEmitter<string>();

  @ContentChild('cellTemplate') cellTemplate?: TemplateRef<any>;
  @ContentChild('actionTemplate') actionTemplate?: TemplateRef<any>;

  readonly rawItems = signal<T[]>([]);
  readonly searchTerm = signal<string>('');
  readonly sortKey = signal<string>('');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly currentPage = signal<number>(1);

  readonly filteredData = computed(() => {
    let items = [...this.rawItems()];
    const query = this.searchTerm().trim().toLowerCase();

    if (query && !this.serverSide) {
      items = items.filter(item => {
        return Object.values(item).some(val => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    const sortKey = this.sortKey();
    if (sortKey) {
      const dir = this.sortDirection() === 'asc' ? 1 : -1;
      items.sort((a, b) => {
        const valA = this.getNestedValue(a, sortKey);
        const valB = this.getNestedValue(b, sortKey);
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        return valA > valB ? dir : -dir;
      });
    }

    return items;
  });

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredData().length / this.pageSize));
  });

  readonly startIndex = computed(() => {
    return (this.currentPage() - 1) * this.pageSize;
  });

  readonly endIndex = computed(() => {
    return Math.min(this.startIndex() + this.pageSize, this.filteredData().length);
  });

  readonly paginatedData = computed(() => {
    const start = this.startIndex();
    return this.filteredData().slice(start, start + this.pageSize);
  });

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.searchChange.emit(term);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.searchChange.emit('');
  }

  onSort(col: TableColumn<T>): void {
    if (!col.sortable) return;
    if (this.sortKey() === col.key) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(col.key);
      this.sortDirection.set('asc');
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return '';
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? '';
  }
}
