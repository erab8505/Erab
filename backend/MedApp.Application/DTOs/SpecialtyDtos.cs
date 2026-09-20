namespace MedApp.Application.DTOs;

public record SpecialtyDto(
    Guid Id,
    Guid AreaId,
    string? AreaName,
    Guid CompanyId,
    string Name,
    string? Description,
    DateTimeOffset CreatedAt
);

public record CreateSpecialtyDto(
    Guid AreaId,
    string Name,
    string? Description
);

public record UpdateSpecialtyDto(
    Guid AreaId,
    string Name,
    string? Description
);
