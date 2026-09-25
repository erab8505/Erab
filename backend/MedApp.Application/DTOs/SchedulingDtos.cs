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

public class CreateSchedulingDto
{
    public Guid PatientId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid? SpecialistId
    {
        get => EmployeeId;
        set
        {
            if (value.HasValue && value.Value != Guid.Empty)
            {
                EmployeeId = value.Value;
            }
        }
    }
    public Guid InterventionTypeId { get; set; }
    public DateTimeOffset ScheduledAt { get; set; }
    public int DurationMinutes { get; set; }
    public string? Notes { get; set; }

    public CreateSchedulingDto() { }

    public CreateSchedulingDto(Guid patientId, Guid employeeId, Guid interventionTypeId, DateTimeOffset scheduledAt, int durationMinutes, string? notes, Guid? specialistId = null)
    {
        PatientId = patientId;
        EmployeeId = employeeId != Guid.Empty ? employeeId : (specialistId ?? Guid.Empty);
        InterventionTypeId = interventionTypeId;
        ScheduledAt = scheduledAt;
        DurationMinutes = durationMinutes;
        Notes = notes;
    }
}

public record UpdateSchedulingStatusDto(
    AppointmentStatus Status
);

public record RescheduleDto(
    DateTimeOffset NewScheduledAt,
    int DurationMinutes
);
