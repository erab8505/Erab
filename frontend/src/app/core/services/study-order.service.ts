import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreateStudyOrderDto,
  SaveStudyResultsDto,
  StudyOrderDto,
  StudyOrderStatus,
  UpdateStudyOrderStatusDto
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class StudyOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/study-orders`;

  getAll(status?: StudyOrderStatus, patientId?: string, fromDate?: string, toDate?: string): Observable<ApiResponse<StudyOrderDto[]>> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (patientId) {
      params = params.set('patientId', patientId);
    }
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }

    return this.http.get<ApiResponse<StudyOrderDto[]>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<StudyOrderDto>> {
    return this.http.get<ApiResponse<StudyOrderDto>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateStudyOrderDto): Observable<ApiResponse<StudyOrderDto>> {
    return this.http.post<ApiResponse<StudyOrderDto>>(this.apiUrl, dto);
  }

  updateStatus(id: string, dto: UpdateStudyOrderStatusDto): Observable<ApiResponse<StudyOrderDto>> {
    return this.http.patch<ApiResponse<StudyOrderDto>>(`${this.apiUrl}/${id}/status`, dto);
  }

  saveResults(id: string, dto: SaveStudyResultsDto): Observable<ApiResponse<StudyOrderDto>> {
    return this.http.post<ApiResponse<StudyOrderDto>>(`${this.apiUrl}/${id}/results`, dto);
  }

  cancel(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }
}
