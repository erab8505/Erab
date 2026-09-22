namespace MedApp.Application.DTOs;

public record EmployeeDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    string FirstName,
    string LastName,
    string FullName,
    string? IdentificationNumber,
    string? LicenseNumber,
    string? JobTitle,
    Guid? SpecialtyId,
    string? SpecialtyName,
    string? Email,
    string? Phone,
    bool IsActive,
    DateTimeOffset CreatedAt
);

public record CreateEmployeeDto(
    string FirstName,
    string LastName,
    string? IdentificationNumber,
    string? LicenseNumber,
    string? JobTitle,
    Guid? SpecialtyId,
    string? Email,
    string? Phone,
    bool? IsActive
);

public record UpdateEmployeeDto(
    string FirstName,
    string LastName,
    string? IdentificationNumber,
    string? LicenseNumber,
    string? JobTitle,
    Guid? SpecialtyId,
    string? Email,
    string? Phone,
    bool IsActive
);

public record EmployeeAvailabilityDto(
    Guid Id,
    Guid EmployeeId,
    int DayOfWeek,
    string DayName,
    string StartHour,
    string EndHour
);

public record SetEmployeeAvailabilityDto(
    int DayOfWeek,
    string StartHour,
    string EndHour
);

public record TimeSlotDto(
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    bool IsAvailable
);
