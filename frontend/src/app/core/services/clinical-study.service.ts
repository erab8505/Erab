import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ClinicalStudyDto, CreateClinicalStudyDto, StudyCategory } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ClinicalStudyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/clinical-studies`;

  getAll(category?: StudyCategory, isActive?: boolean): Observable<ApiResponse<ClinicalStudyDto[]>> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    if (isActive !== undefined && isActive !== null) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<ApiResponse<ClinicalStudyDto[]>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<ClinicalStudyDto>> {
    return this.http.get<ApiResponse<ClinicalStudyDto>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateClinicalStudyDto): Observable<ApiResponse<ClinicalStudyDto>> {
    return this.http.post<ApiResponse<ClinicalStudyDto>>(this.apiUrl, dto);
  }

  update(id: string, dto: CreateClinicalStudyDto): Observable<ApiResponse<ClinicalStudyDto>> {
    return this.http.put<ApiResponse<ClinicalStudyDto>>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }
}
