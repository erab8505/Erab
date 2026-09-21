namespace MedApp.Application.DTOs;

public record ReceptionistDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    string FirstName,
    string LastName,
    string FullName,
    string? IdentificationNumber,
    string? Email,
    string? Phone,
    bool IsActive,
    DateTimeOffset CreatedAt
);

public record CreateReceptionistDto(
    string FirstName,
    string LastName,
    string? IdentificationNumber,
    string? Email,
    string? Phone,
    bool? IsActive
);

public record UpdateReceptionistDto(
    string FirstName,
    string LastName,
    string? IdentificationNumber,
    string? Email,
    string? Phone,
    bool IsActive
);
