using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public record PaymentDto(
    Guid Id,
    Guid CompanyId,
    Guid? SchedulingId,
    Guid PatientId,
    string? PatientName,
    string? PatientDocumentId,
    decimal Amount,
    PaymentMethod Method,
    PaymentStatus Status,
    string? TransactionReference,
    string? InvoiceOrReceiptNumber,
    string? Notes,
    DateTimeOffset? PaidAt,
    DateTimeOffset CreatedAt
);

public record CreatePaymentDto(
    Guid? SchedulingId,
    Guid PatientId,
    decimal Amount,
    PaymentMethod Method,
    PaymentStatus Status = PaymentStatus.Paid,
    string? TransactionReference = null,
    string? Notes = null
);

public record UpdatePaymentStatusDto(
    PaymentStatus Status,
    string? Notes = null
);

public record DailyCashSummaryDto(
    DateTimeOffset Date,
    int TotalTransactions,
    decimal TotalAmount,
    decimal CashAmount,
    decimal CardAmount,
    decimal TransferAmount,
    decimal ElectronicWalletAmount,
    int PendingCount,
    int PaidCount
);
