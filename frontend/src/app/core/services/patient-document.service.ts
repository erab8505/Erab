import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, DocumentCategory, PatientDocumentDto } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PatientDocumentService {
  private http = inject(HttpClient);
  private baseApiUrl = `${environment.apiUrl}/patients`;

  getDocuments(patientId: string, category?: DocumentCategory): Observable<ApiResponse<PatientDocumentDto[]>> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<PatientDocumentDto[]>>(`${this.baseApiUrl}/${patientId}/documents`, { params });
  }

  getDocumentById(patientId: string, id: string): Observable<ApiResponse<PatientDocumentDto>> {
    return this.http.get<ApiResponse<PatientDocumentDto>>(`${this.baseApiUrl}/${patientId}/documents/${id}`);
  }

  uploadDocument(
    patientId: string,
    file: File,
    title?: string,
    category: DocumentCategory = 'Other',
    description?: string,
    medicalRecordId?: string
  ): Observable<HttpEvent<ApiResponse<PatientDocumentDto>>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (title) formData.append('title', title);
    formData.append('category', category);
    if (description) formData.append('description', description);
    if (medicalRecordId) formData.append('medicalRecordId', medicalRecordId);

    const req = new HttpRequest('POST', `${this.baseApiUrl}/${patientId}/documents`, formData, {
      reportProgress: true
    });

    return this.http.request<ApiResponse<PatientDocumentDto>>(req);
  }

  downloadDocumentUrl(patientId: string, id: string): string {
    return `${this.baseApiUrl}/${patientId}/documents/${id}/download`;
  }

  downloadDocumentBlob(patientId: string, id: string): Observable<Blob> {
    return this.http.get(`${this.baseApiUrl}/${patientId}/documents/${id}/download`, {
      responseType: 'blob'
    });
  }

  deleteDocument(patientId: string, id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseApiUrl}/${patientId}/documents/${id}`);
  }
}
