using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;
    private readonly ICurrentUserService _currentUserService;

    public PaymentService(
        IApplicationDbContext context,
        ICompanyContext companyContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _companyContext = companyContext;
        _currentUserService = currentUserService;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<PaymentDto>> GetPaymentsAsync(
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        PaymentStatus? status = null,
        Guid? patientId = null)
    {
        var query = _context.Payments
            .Include(p => p.Patient)
            .Include(p => p.Scheduling)
            .AsQueryable();

        if (fromDate.HasValue)
        {
            query = query.Where(p => p.CreatedAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(p => p.CreatedAt <= toDate.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        if (patientId.HasValue)
        {
            query = query.Where(p => p.PatientId == patientId.Value);
        }

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentDto(
                p.Id,
                p.CompanyId,
                p.SchedulingId,
                p.PatientId,
                $"{p.Patient.FirstName} {p.Patient.LastName}",
                p.Patient.DocumentId,
                p.Amount,
                p.Method,
                p.Status,
                p.TransactionReference,
                p.InvoiceOrReceiptNumber,
                p.Notes,
                p.PaidAt,
                p.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<PaymentDto?> GetPaymentByIdAsync(Guid id)
    {
        var p = await _context.Payments
            .Include(p => p.Patient)
            .Include(p => p.Scheduling)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null) return null;

        return new PaymentDto(
            p.Id,
            p.CompanyId,
            p.SchedulingId,
            p.PatientId,
            $"{p.Patient.FirstName} {p.Patient.LastName}",
            p.Patient.DocumentId,
            p.Amount,
            p.Method,
            p.Status,
            p.TransactionReference,
            p.InvoiceOrReceiptNumber,
            p.Notes,
            p.PaidAt,
            p.CreatedAt
        );
    }

    public async Task<PaymentDto?> GetPaymentBySchedulingIdAsync(Guid schedulingId)
    {
        var p = await _context.Payments
            .Include(p => p.Patient)
            .Include(p => p.Scheduling)
            .FirstOrDefaultAsync(p => p.SchedulingId == schedulingId);

        if (p == null) return null;

        return new PaymentDto(
            p.Id,
            p.CompanyId,
            p.SchedulingId,
            p.PatientId,
            $"{p.Patient.FirstName} {p.Patient.LastName}",
            p.Patient.DocumentId,
            p.Amount,
            p.Method,
            p.Status,
            p.TransactionReference,
            p.InvoiceOrReceiptNumber,
            p.Notes,
            p.PaidAt,
            p.CreatedAt
        );
    }

    public async Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto dto)
    {
        var patientExists = await _context.Patients.AnyAsync(p => p.Id == dto.PatientId);
        if (!patientExists)
            throw new NotFoundException("Paciente no encontrado.");

        if (dto.SchedulingId.HasValue)
        {
            var scheduling = await _context.Schedulings.FirstOrDefaultAsync(s => s.Id == dto.SchedulingId.Value);
            if (scheduling == null)
                throw new NotFoundException("Cita médica no encontrada.");

            // Check if payment already exists for this scheduling
            var existing = await _context.Payments.FirstOrDefaultAsync(p => p.SchedulingId == dto.SchedulingId.Value);
            if (existing != null)
            {
                // Update existing payment
                existing.Amount = dto.Amount;
                existing.Method = dto.Method;
                existing.Status = dto.Status;
                existing.TransactionReference = dto.TransactionReference;
                existing.Notes = dto.Notes;
                existing.PaidAt = dto.Status == PaymentStatus.Paid ? DateTimeOffset.UtcNow : null;
                await _context.SaveChangesAsync();
                return (await GetPaymentByIdAsync(existing.Id))!;
            }
        }

        var count = await _context.Payments.CountAsync();
        var receiptNumber = $"REC-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

        var payment = new Payment
        {
            CompanyId = CurrentCompanyId,
            SchedulingId = dto.SchedulingId,
            PatientId = dto.PatientId,
            Amount = dto.Amount,
            Method = dto.Method,
            Status = dto.Status,
            TransactionReference = dto.TransactionReference,
            InvoiceOrReceiptNumber = receiptNumber,
            Notes = dto.Notes,
            PaidAt = dto.Status == PaymentStatus.Paid ? DateTimeOffset.UtcNow : null,
            CreatedByUserId = _currentUserService.UserId
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return (await GetPaymentByIdAsync(payment.Id))!;
    }

    public async Task<PaymentDto> UpdatePaymentStatusAsync(Guid id, UpdatePaymentStatusDto dto)
    {
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null)
            throw new NotFoundException("Registro de pago no encontrado.");

        payment.Status = dto.Status;
        if (dto.Status == PaymentStatus.Paid && !payment.PaidAt.HasValue)
        {
            payment.PaidAt = DateTimeOffset.UtcNow;
        }

        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            payment.Notes = string.IsNullOrWhiteSpace(payment.Notes)
                ? dto.Notes
                : $"{payment.Notes} | {dto.Notes}";
        }

        await _context.SaveChangesAsync();
        return (await GetPaymentByIdAsync(payment.Id))!;
    }

    public async Task<DailyCashSummaryDto> GetDailySummaryAsync(DateTimeOffset? date = null)
    {
        var targetDate = date?.Date ?? DateTimeOffset.UtcNow.Date;
        var nextDay = targetDate.AddDays(1);

        var payments = await _context.Payments
            .Where(p => p.CreatedAt >= targetDate && p.CreatedAt < nextDay)
            .ToListAsync();

        var paidPayments = payments.Where(p => p.Status == PaymentStatus.Paid).ToList();

        return new DailyCashSummaryDto(
            targetDate,
            TotalTransactions: payments.Count,
            TotalAmount: paidPayments.Sum(p => p.Amount),
            CashAmount: paidPayments.Where(p => p.Method == PaymentMethod.Cash).Sum(p => p.Amount),
            CardAmount: paidPayments.Where(p => p.Method == PaymentMethod.CreditCard || p.Method == PaymentMethod.DebitCard).Sum(p => p.Amount),
            TransferAmount: paidPayments.Where(p => p.Method == PaymentMethod.BankTransfer).Sum(p => p.Amount),
            ElectronicWalletAmount: paidPayments.Where(p => p.Method == PaymentMethod.ElectronicWallet).Sum(p => p.Amount),
            PendingCount: payments.Count(p => p.Status == PaymentStatus.Pending),
            PaidCount: paidPayments.Count
        );
    }
}
