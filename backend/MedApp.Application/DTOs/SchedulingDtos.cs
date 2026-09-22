using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public record SchedulingDto(
    Guid Id,
    Guid CompanyId,
    Guid PatientId,
    string? PatientName,
    string? PatientDocumentId,
    Guid EmployeeId,
    string? EmployeeName,
    Guid InterventionTypeId,
    string? InterventionTypeName,
    DateTimeOffset ScheduledAt,
    int DurationMinutes,
    string? Notes,
    AppointmentStatus Status,
    DateTimeOffset CreatedAt,
    PaymentStatus? PaymentStatus = null,
    decimal? PaymentAmount = null,
    PaymentMethod? PaymentMethod = null,
    Guid? PaymentId = null
)
{
    public Guid SpecialistId => EmployeeId;
    public string? SpecialistName => EmployeeName;
}

public record CreateSchedulingDto(
    Guid PatientId,
    Guid EmployeeId,
    Guid InterventionTypeId,
    DateTimeOffset ScheduledAt,
    int DurationMinutes,
    string? Notes
);

public record UpdateSchedulingStatusDto(
    AppointmentStatus Status
);

public record RescheduleDto(
    DateTimeOffset NewScheduledAt,
    int DurationMinutes
);
