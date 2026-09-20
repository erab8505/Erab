namespace MedApp.Application.DTOs;

public record SpecialistDto(
    Guid Id,
    Guid SpecialtyId,
    string? SpecialtyName,
    Guid CompanyId,
    string FirstName,
    string LastName,
    string LicenseNumber,
    string? Email,
    string? Phone,
    bool IsActive,
    DateTimeOffset CreatedAt
)
{
    public string FullName => $"{FirstName} {LastName}".Trim();
}

public record CreateSpecialistDto(
    Guid SpecialtyId,
    string FirstName,
    string LastName,
    string LicenseNumber,
    string? Email,
    string? Phone,
    bool IsActive
);

public record UpdateSpecialistDto(
    Guid SpecialtyId,
    string FirstName,
    string LastName,
    string LicenseNumber,
    string? Email,
    string? Phone,
    bool IsActive
);
