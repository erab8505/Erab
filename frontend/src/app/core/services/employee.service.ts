import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  EmployeeDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeAvailabilityDto,
  CreateEmployeeAvailabilityDto,
  BulkEmployeeAvailabilityDto,
  AvailableSlotDto
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/employees`;

  getEmployees(specialtyId?: string, isActive?: boolean): Observable<ApiResponse<EmployeeDto[]>> {
    let params = new HttpParams();
    if (specialtyId) {
      params = params.set('specialtyId', specialtyId);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }
    return this.http.get<ApiResponse<EmployeeDto[]>>(this.apiUrl, { params });
  }

  getEmployeeById(id: string): Observable<ApiResponse<EmployeeDto>> {
    return this.http.get<ApiResponse<EmployeeDto>>(`${this.apiUrl}/${id}`);
  }

  createEmployee(dto: CreateEmployeeDto): Observable<ApiResponse<EmployeeDto>> {
    return this.http.post<ApiResponse<EmployeeDto>>(this.apiUrl, dto);
  }

  updateEmployee(id: string, dto: UpdateEmployeeDto): Observable<ApiResponse<EmployeeDto>> {
    return this.http.put<ApiResponse<EmployeeDto>>(`${this.apiUrl}/${id}`, dto);
  }

  deleteEmployee(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getAvailability(employeeId: string): Observable<ApiResponse<EmployeeAvailabilityDto[]>> {
    return this.http.get<ApiResponse<EmployeeAvailabilityDto[]>>(`${this.apiUrl}/${employeeId}/availability`);
  }

  setAvailability(employeeId: string, dto: CreateEmployeeAvailabilityDto): Observable<ApiResponse<EmployeeAvailabilityDto>> {
    return this.http.post<ApiResponse<EmployeeAvailabilityDto>>(`${this.apiUrl}/${employeeId}/availability`, dto);
  }

  setBulkAvailability(employeeId: string, dto: BulkEmployeeAvailabilityDto): Observable<ApiResponse<EmployeeAvailabilityDto[]>> {
    return this.http.post<ApiResponse<EmployeeAvailabilityDto[]>>(`${this.apiUrl}/${employeeId}/availability/bulk`, dto);
  }

  getAvailableSlots(employeeId: string, date: string, durationMinutes: number = 30): Observable<ApiResponse<AvailableSlotDto[]>> {
    const params = new HttpParams()
      .set('date', date)
      .set('durationMinutes', durationMinutes.toString());
    return this.http.get<ApiResponse<AvailableSlotDto[]>>(`${this.apiUrl}/${employeeId}/slots`, { params });
  }
}
