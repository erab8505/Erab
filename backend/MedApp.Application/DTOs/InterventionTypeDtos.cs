namespace MedApp.Application.DTOs;

public record InterventionTypeDto(
    Guid Id,
    Guid SpecialtyId,
    string? SpecialtyName,
    Guid CompanyId,
    string Name,
    string? Code,
    string? Description,
    int DurationMinutes,
    bool RequiresAnesthesia,
    bool RequiresHospitalization,
    bool IsActive,
    DateTimeOffset CreatedAt
);

public record CreateInterventionTypeDto(
    Guid SpecialtyId,
    string Name,
    string? Code,
    string? Description,
    int DurationMinutes,
    bool RequiresAnesthesia,
    bool RequiresHospitalization,
    bool IsActive
);

public record UpdateInterventionTypeDto(
    Guid SpecialtyId,
    string Name,
    string? Code,
    string? Description,
    int DurationMinutes,
    bool RequiresAnesthesia,
    bool RequiresHospitalization,
    bool IsActive
);
