namespace MedApp.Application.DTOs;

public record CompanyDto(
    Guid Id,
    string Name,
    string? TaxId,
    string? Address,
    string? Phone,
    string? Email,
    bool IsActive,
    string? Description,
    DateTimeOffset CreatedAt
);

public record CreateCompanyDto(
    string Name,
    string? TaxId,
    string? Address,
    string? Phone,
    string? Email,
    bool IsActive,
    string? Description
);

public record UpdateCompanyDto(
    string Name,
    string? TaxId,
    string? Address,
    string? Phone,
    string? Email,
    bool IsActive,
    string? Description
);
