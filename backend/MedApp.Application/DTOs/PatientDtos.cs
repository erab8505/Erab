using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public record PatientDto(
    Guid Id,
    Guid CompanyId,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    int Age,
    Gender Gender,
    string DocumentId,
    string? Email,
    string? Phone,
    string? BloodType,
    string? Allergies,
    DateTimeOffset CreatedAt
)
{
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string DateOfBirth => BirthDate.ToString("yyyy-MM-dd");
}

public record CreatePatientDto(
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    Gender Gender,
    string DocumentId,
    string? Email,
    string? Phone,
    string? BloodType,
    string? Allergies
);

public record UpdatePatientDto(
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    Gender Gender,
    string DocumentId,
    string? Email,
    string? Phone,
    string? BloodType,
    string? Allergies
);
