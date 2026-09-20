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
);

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
