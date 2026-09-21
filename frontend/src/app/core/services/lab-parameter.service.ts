import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreateLabParameterDto, LabParameterDto, UpdateLabParameterDto } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class LabParameterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/lab-parameters`;

  getAll(search?: string, isActive?: boolean): Observable<ApiResponse<LabParameterDto[]>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined && isActive !== null) params = params.set('isActive', isActive.toString());

    return this.http.get<ApiResponse<LabParameterDto[]>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<LabParameterDto>> {
    return this.http.get<ApiResponse<LabParameterDto>>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateLabParameterDto): Observable<ApiResponse<LabParameterDto>> {
    return this.http.post<ApiResponse<LabParameterDto>>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateLabParameterDto): Observable<ApiResponse<LabParameterDto>> {
    return this.http.put<ApiResponse<LabParameterDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`);
  }
}
