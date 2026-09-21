import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreatePaymentDto, DailyCashSummaryDto, PaymentDto, PaymentStatus } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  getPayments(filters?: { fromDate?: string; toDate?: string; status?: PaymentStatus; patientId?: string }): Observable<ApiResponse<PaymentDto[]>> {
    let params = new HttpParams();
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.patientId) params = params.set('patientId', filters.patientId);

    return this.http.get<ApiResponse<PaymentDto[]>>(this.apiUrl, { params });
  }

  getPaymentById(id: string): Observable<ApiResponse<PaymentDto>> {
    return this.http.get<ApiResponse<PaymentDto>>(`${this.apiUrl}/${id}`);
  }

  getPaymentBySchedulingId(schedulingId: string): Observable<ApiResponse<PaymentDto | null>> {
    return this.http.get<ApiResponse<PaymentDto | null>>(`${this.apiUrl}/by-scheduling/${schedulingId}`);
  }

  createPayment(dto: CreatePaymentDto): Observable<ApiResponse<PaymentDto>> {
    return this.http.post<ApiResponse<PaymentDto>>(this.apiUrl, dto);
  }

  updatePaymentStatus(id: string, status: PaymentStatus, notes?: string): Observable<ApiResponse<PaymentDto>> {
    return this.http.patch<ApiResponse<PaymentDto>>(`${this.apiUrl}/${id}/status`, { status, notes });
  }

  getDailySummary(date?: string): Observable<ApiResponse<DailyCashSummaryDto>> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<ApiResponse<DailyCashSummaryDto>>(`${this.apiUrl}/daily-summary`, { params });
  }
}
