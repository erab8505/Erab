import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentCategory, PatientDocumentDto } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { PatientDocumentService } from '../../../core/services/patient-document.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-patient-documents-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmDialogComponent],
  template: `
    <div class="patient-documents-container">
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="text-base font-bold m-0 text-slate-900 dark:text-slate-100">
            Estudios y Archivos Adjuntos
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 m-0">
            Laboratorios, radiografías, consentimientos informados e imágenes clínicas
          </p>
        </div>

        <button type="button" class="btn btn-primary btn-sm" (click)="openUploadModal()">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Subir Archivo / Estudio
        </button>
      </div>

      <!-- Drag & Drop Quick Dropzone -->
      <div
        class="dropzone-box"
        [class.dragging]="isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onFileDrop($event)"
        (click)="fileInput.click()">
        <input #fileInput type="file" multiple class="hidden" (change)="onFileSelected($event)" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.dcm" />
        
        <div class="flex flex-col items-center justify-center text-center p-6">
          <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 m-0">
            Arrastra y suelta aquí tus archivos o <span class="text-blue-600 dark:text-blue-400 underline">haz clic para explorar</span>
          </p>
          <p class="text-xs text-slate-400 mt-1 mb-0">
            Soporta PDF, JPG, PNG, WEBP y DICOM (Hasta 25 MB por archivo)
          </p>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto py-3">
        <button
          type="button"
          class="pill-filter"
          [class.active]="selectedCategory() === null"
          (click)="filterByCategory(null)">
          Todos ({{ documents().length }})
        </button>
        <button
          type="button"
          class="pill-filter"
          [class.active]="selectedCategory() === 'LabResult'"
          (click)="filterByCategory('LabResult')">
          🧪 Laboratorios ({{ countByCategory('LabResult') }})
        </button>
        <button
          type="button"
          class="pill-filter"
          [class.active]="selectedCategory() === 'ImagingXRay'"
          (click)="filterByCategory('ImagingXRay')">
          🩻 Radiografías / Imágenes ({{ countByCategory('ImagingXRay') }})
        </button>
        <button
          type="button"
          class="pill-filter"
          [class.active]="selectedCategory() === 'ConsentForm'"
          (click)="filterByCategory('ConsentForm')">
          📝 Consentimientos ({{ countByCategory('ConsentForm') }})
        </button>
        <button
          type="button"
          class="pill-filter"
          [class.active]="selectedCategory() === 'ExternalReport'"
          (click)="filterByCategory('ExternalReport')">
          📄 Informes Externos ({{ countByCategory('ExternalReport') }})
        </button>
        <button
          type="button"
          class="pill-filter"
          [class.active]="selectedCategory() === 'Other'"
          (click)="filterByCategory('Other')">
          📁 Otros ({{ countByCategory('Other') }})
        </button>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="py-12 text-center text-slate-500">
          <span class="spinner-sm"></span>
          <span class="ml-2 text-sm">Cargando archivos del paciente...</span>
        </div>
      } @else if (filteredDocuments().length === 0) {
        <!-- Empty State -->
        <div class="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 my-4">
          <span class="text-3xl mb-2 block">📂</span>
          <h4 class="font-semibold text-slate-700 dark:text-slate-300 text-sm">No hay archivos registrados</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Puedes adjuntar exámenes de sangre, radiografías o consentimientos informados arrastrándolos al cuadro superior.
          </p>
        </div>
      } @else {
        <!-- Documents Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          @for (doc of filteredDocuments(); track doc.id) {
            <div class="doc-card">
              <!-- Card Thumbnail / Icon Header -->
              <div class="doc-preview" (click)="previewDocument(doc)">
                @if (isImage(doc.contentType)) {
                  <img [src]="getAuthenticatedDownloadUrl(doc.id)" [alt]="doc.title" class="preview-img" />
                } @else if (doc.contentType === 'application/pdf') {
                  <div class="pdf-placeholder">
                    <span class="text-3xl">📄</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mt-1">PDF</span>
                  </div>
                } @else {
                  <div class="generic-placeholder">
                    <span class="text-3xl">📁</span>
                    <span class="text-[10px] font-bold uppercase text-slate-500 mt-1">{{ doc.contentType }}</span>
                  </div>
                }

                <span class="category-badge">
                  {{ getCategoryLabel(doc.category) }}
                </span>
              </div>

              <!-- Card Body Info -->
              <div class="p-3 flex flex-col flex-1 justify-between">
                <div>
                  <h4 class="doc-title font-semibold text-xs text-slate-900 dark:text-slate-100 truncate" [title]="doc.title">
                    {{ doc.title }}
                  </h4>
                  <p class="doc-filename text-[11px] text-slate-400 truncate mt-0.5" [title]="doc.originalFileName">
                    {{ doc.originalFileName }}
                  </p>
                  @if (doc.description) {
                    <p class="text-[11px] text-slate-500 italic truncate mt-1" [title]="doc.description">
                      {{ doc.description }}
                    </p>
                  }
                </div>

                <div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{{ formatBytes(doc.fileSizeBytes) }}</span>
                  <span>{{ doc.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>

                <!-- Action Buttons -->
                <div class="grid grid-cols-3 gap-1 mt-2">
                  <button type="button" class="action-btn" (click)="previewDocument(doc)" title="Visualizar">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <span>Ver</span>
                  </button>
                  <button type="button" class="action-btn" (click)="downloadFile(doc)" title="Descargar">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    <span>Bajar</span>
                  </button>
                  <button type="button" class="action-btn danger" (click)="confirmDelete(doc)" title="Eliminar">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Upload Modal -->
      <app-modal [isOpen]="isUploadModalOpen()" title="Adjuntar Nuevo Estudio o Archivo" size="md" (closed)="closeUploadModal()">
        <form (ngSubmit)="submitUpload()" class="flex flex-col gap-4">
          <!-- File selection -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Archivo a Subir *
            </label>
            <input
              type="file"
              (change)="onModalFileSelected($event)"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.dcm"
              class="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/40 dark:file:text-blue-300" />
            @if (uploadFile) {
              <p class="text-xs text-emerald-600 mt-1 font-semibold">
                ✓ Archivo seleccionado: {{ uploadFile.name }} ({{ formatBytes(uploadFile.size) }})
              </p>
            }
          </div>

          <!-- Document Title -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Título o Nombre Descriptivo *
            </label>
            <input
              type="text"
              [(ngModel)]="uploadTitle"
              name="title"
              placeholder="Ej: Hemograma Completo 2026, Radiografía Tórax AP"
              class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white" />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Categoría del Documento *
            </label>
            <select
              [(ngModel)]="uploadCategory"
              name="category"
              class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white">
              <option value="LabResult">🧪 Análisis de Laboratorio</option>
              <option value="ImagingXRay">🩻 Radiografía / Imagen / Ecografía</option>
              <option value="ConsentForm">📝 Consentimiento Informado</option>
              <option value="ExternalReport">📄 Informe Médico Externo</option>
              <option value="Other">📁 Otro Documento</option>
            </select>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Notas o Hallazgos Relevantes (Opcional)
            </label>
            <textarea
              [(ngModel)]="uploadDescription"
              name="description"
              rows="2"
              placeholder="Ej: Resultados dentro de parámetros normales, control en 6 meses..."
              class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"></textarea>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button type="button" class="btn btn-secondary" (click)="closeUploadModal()" [disabled]="uploading()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="!uploadFile || uploading()">
              @if (uploading()) {
                <span class="spinner-sm"></span>
                <span class="ml-1">Subiendo...</span>
              } @else {
                <span>📤 Subir Archivo</span>
              }
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Document Preview Modal (Lightbox) -->
      <app-modal [isOpen]="isPreviewModalOpen()" [title]="previewDoc?.title || 'Previsualización'" size="lg" (closed)="closePreviewModal()">
        @if (loadingPreview()) {
          <div class="flex flex-col items-center justify-center p-12 text-slate-500">
            <span class="spinner-sm"></span>
            <span class="text-xs mt-2">Cargando archivo...</span>
          </div>
        } @else if (previewDoc) {
          <div class="flex flex-col items-center justify-center p-2 min-h-[300px]">
            @if (isImage(previewDoc.contentType) && previewSafeUrl) {
              <img [src]="previewSafeUrl" [alt]="previewDoc.title" class="max-h-[70vh] max-w-full rounded-lg object-contain shadow" />
            } @else if (previewDoc.contentType === 'application/pdf' && previewSafeUrl) {
              <iframe [src]="previewSafeUrl" class="w-full h-[65vh] rounded-lg border border-slate-200 dark:border-slate-700"></iframe>
            } @else {
              <div class="text-center p-8">
                <span class="text-5xl block mb-2">📁</span>
                <p class="font-semibold text-slate-800 dark:text-slate-200">{{ previewDoc.originalFileName }}</p>
                <p class="text-xs text-slate-400 mt-1">Este formato no se puede previsualizar en el navegador.</p>
                <button type="button" (click)="downloadFile(previewDoc)" class="btn btn-primary btn-sm mt-3 inline-flex items-center">
                  Descargar Archivo
                </button>
              </div>
            }
          </div>
        }
      </app-modal>

      <!-- Delete Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        title="Eliminar Archivo"
        [message]="'¿Estás seguro de que deseas eliminar permanentemente el archivo ' + (docToDelete?.title || '') + '?'"
        confirmText="Sí, Eliminar"
        (confirmed)="onDeleteConfirmed()"
        (cancelled)="isDeleteDialogOpen.set(false)" />
    </div>
  `,
  styles: [`
    .dropzone-box {
      border: 2px dashed #cbd5e1;
      border-radius: 0.75rem;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    :host-context(.dark) .dropzone-box {
      border-color: #334155;
      background: #0f172a;
    }
    .dropzone-box:hover, .dropzone-box.dragging {
      border-color: var(--primary-color, #0284c7);
      background: #eff6ff;
    }
    :host-context(.dark) .dropzone-box:hover, :host-context(.dark) .dropzone-box.dragging {
      background: #1e293b;
    }
    .pill-filter {
      white-space: nowrap;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }
    :host-context(.dark) .pill-filter {
      background: #1e293b;
      border-color: #334155;
      color: #94a3b8;
    }
    .pill-filter:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    :host-context(.dark) .pill-filter:hover {
      background: #334155;
      color: #f8fafc;
    }
    .pill-filter.active {
      background: var(--primary-color, #0284c7);
      color: #ffffff;
      border-color: var(--primary-color, #0284c7);
    }
    .doc-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    :host-context(.dark) .doc-card {
      background: #1e293b;
      border-color: #334155;
    }
    .doc-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }
    .doc-preview {
      height: 120px;
      background: #f1f5f9;
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    :host-context(.dark) .doc-preview {
      background: #0f172a;
    }
    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .pdf-placeholder, .generic-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .category-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 0.25rem;
    }
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.35rem;
      font-size: 0.7rem;
      font-weight: 600;
      border-radius: 0.375rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      text-decoration: none;
      transition: all 0.15s;
      cursor: pointer;
    }
    :host-context(.dark) .action-btn {
      background: #0f172a;
      border-color: #334155;
      color: #94a3b8;
    }
    .action-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    :host-context(.dark) .action-btn:hover {
      background: #334155;
      color: #f8fafc;
    }
    .action-btn.danger:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #b91c1c;
    }
    :host-context(.dark) .action-btn.danger:hover {
      background: rgba(185, 28, 28, 0.2);
      border-color: #ef4444;
      color: #f87171;
    }
  `]
})
export class PatientDocumentsTabComponent implements OnInit {
  private documentService = inject(PatientDocumentService);
  private authService = inject(AuthService);
  private companyContext = inject(CompanyContextService);
  private sanitizer = inject(DomSanitizer);
  private toast = inject(ToastService);

  @Input() patientId: string = '';

  documents = signal<PatientDocumentDto[]>([]);
  loading = signal<boolean>(false);
  isDragging = signal<boolean>(false);
  selectedCategory = signal<DocumentCategory | null>(null);

  isUploadModalOpen = signal<boolean>(false);
  uploading = signal<boolean>(false);
  uploadFile: File | null = null;
  uploadTitle = '';
  uploadCategory: DocumentCategory = 'LabResult';
  uploadDescription = '';

  isPreviewModalOpen = signal<boolean>(false);
  loadingPreview = signal<boolean>(false);
  previewDoc: PatientDocumentDto | null = null;
  previewSafeUrl: SafeResourceUrl | null = null;
  previewBlobUrl: string | null = null;

  isDeleteDialogOpen = signal<boolean>(false);
  docToDelete: PatientDocumentDto | null = null;

  ngOnInit(): void {
    if (this.patientId) {
      this.loadDocuments();
    }
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.documentService.getDocuments(this.patientId).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.documents.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar los documentos del paciente.');
      }
    });
  }

  filteredDocuments(): PatientDocumentDto[] {
    const cat = this.selectedCategory();
    if (!cat) return this.documents();
    return this.documents().filter(d => d.category === cat);
  }

  countByCategory(category: DocumentCategory): number {
    return this.documents().filter(d => d.category === category).length;
  }

  filterByCategory(category: DocumentCategory | null): void {
    this.selectedCategory.set(category);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.handleSelectedFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleSelectedFile(input.files[0]);
      input.value = '';
    }
  }

  handleSelectedFile(file: File): void {
    this.uploadFile = file;
    this.uploadTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    this.isUploadModalOpen.set(true);
  }

  openUploadModal(): void {
    this.uploadFile = null;
    this.uploadTitle = '';
    this.uploadCategory = 'LabResult';
    this.uploadDescription = '';
    this.isUploadModalOpen.set(true);
  }

  closeUploadModal(): void {
    this.isUploadModalOpen.set(false);
  }

  onModalFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile = input.files[0];
      if (!this.uploadTitle) {
        this.uploadTitle = this.uploadFile.name.substring(0, this.uploadFile.name.lastIndexOf('.')) || this.uploadFile.name;
      }
    }
  }

  submitUpload(): void {
    if (!this.uploadFile || !this.patientId) return;

    this.uploading.set(true);
    this.documentService.uploadDocument(
      this.patientId,
      this.uploadFile,
      this.uploadTitle,
      this.uploadCategory,
      this.uploadDescription
    ).subscribe({
      next: (event: any) => {
        if (event.body) {
          this.uploading.set(false);
          this.toast.success('Archivo adjuntado exitosamente.');
          this.closeUploadModal();
          this.loadDocuments();
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.toast.error(err?.error?.message || 'Error al subir el archivo.');
      }
    });
  }

  previewDocument(doc: PatientDocumentDto): void {
    this.previewDoc = doc;
    this.cleanupPreviewUrl();
    this.isPreviewModalOpen.set(true);

    if (this.isImage(doc.contentType) || doc.contentType === 'application/pdf') {
      this.loadingPreview.set(true);
      this.documentService.downloadDocumentBlob(this.patientId, doc.id).subscribe({
        next: (blob) => {
          this.loadingPreview.set(false);
          this.previewBlobUrl = URL.createObjectURL(blob);
          this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewBlobUrl);
        },
        error: () => {
          this.loadingPreview.set(false);
          this.toast.error('No se pudo cargar el archivo para previsualización.');
        }
      });
    }
  }

  closePreviewModal(): void {
    this.isPreviewModalOpen.set(false);
    this.cleanupPreviewUrl();
    this.previewDoc = null;
  }

  private cleanupPreviewUrl(): void {
    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
      this.previewBlobUrl = null;
    }
    this.previewSafeUrl = null;
  }

  downloadFile(doc: PatientDocumentDto): void {
    this.documentService.downloadDocumentBlob(this.patientId, doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.originalFileName || doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.toast.error('Error al descargar el archivo.');
      }
    });
  }

  confirmDelete(doc: PatientDocumentDto): void {
    this.docToDelete = doc;
    this.isDeleteDialogOpen.set(true);
  }

  onDeleteConfirmed(): void {
    if (!this.docToDelete) return;

    this.documentService.deleteDocument(this.patientId, this.docToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Archivo eliminado correctamente.');
          this.isDeleteDialogOpen.set(false);
          this.docToDelete = null;
          this.loadDocuments();
        }
      },
      error: () => {
        this.toast.error('No se pudo eliminar el archivo.');
      }
    });
  }

  getAuthenticatedDownloadUrl(id: string): string {
    const base = this.documentService.downloadDocumentUrl(this.patientId, id);
    const token = this.authService.token();
    const companyId = this.companyContext.activeCompanyId();
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (companyId) params.set('companyId', companyId);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  getDownloadUrl(id: string): string {
    return this.getAuthenticatedDownloadUrl(id);
  }

  isImage(contentType: string): boolean {
    return !!contentType && contentType.startsWith('image/');
  }

  getCategoryLabel(category: DocumentCategory): string {
    switch (category) {
      case 'LabResult': return 'Laboratorio';
      case 'ImagingXRay': return 'Radiografía / Imagen';
      case 'ConsentForm': return 'Consentimiento';
      case 'ExternalReport': return 'Informe Externo';
      case 'PrescriptionOrder': return 'Orden Médica';
      default: return 'Estudio';
    }
  }

  formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
