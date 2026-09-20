using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public record SchedulingDto(
    Guid Id,
    Guid CompanyId,
    Guid PatientId,
    string? PatientName,
    string? PatientDocumentId,
    Guid SpecialistId,
    string? SpecialistName,
    Guid InterventionTypeId,
    string? InterventionTypeName,
    DateTimeOffset ScheduledAt,
    int DurationMinutes,
    string? Notes,
    AppointmentStatus Status,
    DateTimeOffset CreatedAt
);

public record CreateSchedulingDto(
    Guid PatientId,
    Guid SpecialistId,
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
