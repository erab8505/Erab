namespace MedApp.Application.DTOs;

public record SpecialistAvailabilityDto(
    Guid Id,
    Guid SpecialistId,
    int DayOfWeek,
    string StartHour,
    string EndHour
);

public record CreateSpecialistAvailabilityDto(
    Guid SpecialistId,
    int DayOfWeek,
    string StartHour,
    string EndHour
);

public record TimeSlotDto(
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    bool IsAvailable
);
