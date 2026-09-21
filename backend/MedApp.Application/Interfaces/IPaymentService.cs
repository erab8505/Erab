using MedApp.Application.DTOs;
using MedApp.Domain.Enums;

namespace MedApp.Application.Interfaces;

public interface IPaymentService
{
    Task<List<PaymentDto>> GetPaymentsAsync(DateTimeOffset? fromDate = null, DateTimeOffset? toDate = null, PaymentStatus? status = null, Guid? patientId = null);
    Task<PaymentDto?> GetPaymentByIdAsync(Guid id);
    Task<PaymentDto?> GetPaymentBySchedulingIdAsync(Guid schedulingId);
    Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto dto);
    Task<PaymentDto> UpdatePaymentStatusAsync(Guid id, UpdatePaymentStatusDto dto);
    Task<DailyCashSummaryDto> GetDailySummaryAsync(DateTimeOffset? date = null);
}
