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
    DateTimeOffset CreatedAt,
    Dictionary<string, bool>? Features = null
);

public record CompanyFeatureDto(
    string FeatureKey,
    bool IsEnabled,
    string? ConfigValue = null
);

public record CreateCompanyDto(
    string Name,
    string? TaxId,
    string? Address,
    string? Phone,
    string? Email,
    bool IsActive,
    string? Description,
    Dictionary<string, bool>? Features = null
);

public record UpdateCompanyDto(
    string Name,
    string? TaxId,
    string? Address,
    string? Phone,
    string? Email,
    bool IsActive,
    string? Description,
    Dictionary<string, bool>? Features = null
);
