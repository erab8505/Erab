import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreateLabExamDto, LabExamDto, UpdateLabExamDto } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class LabExamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/lab-exams`;

  getAll(search?: string, isActive?: boolean): Observable<ApiResponse<LabExamDto[]>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined && isActive !== null) params = params.set('isActive', isActive.toString());

    return this.http.get<ApiResponse<LabExamDto[]>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<LabExamDto>> {
    return this.http.get<ApiResponse<LabExamDto>>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateLabExamDto): Observable<ApiResponse<LabExamDto>> {
    return this.http.post<ApiResponse<LabExamDto>>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateLabExamDto): Observable<ApiResponse<LabExamDto>> {
    return this.http.put<ApiResponse<LabExamDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`);
  }
}
