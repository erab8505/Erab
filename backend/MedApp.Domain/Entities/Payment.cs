using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public Guid? SchedulingId { get; set; }
    public Scheduling? Scheduling { get; set; }

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;
    public PaymentStatus Status { get; set; } = PaymentStatus.Paid;

    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }
    public string? InvoiceOrReceiptNumber { get; set; }

    public DateTimeOffset? PaidAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
}
