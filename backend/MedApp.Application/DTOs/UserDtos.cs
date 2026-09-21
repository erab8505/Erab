using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public record UserDto(
    Guid Id,
    string Username,
    UserRole Role,
    Guid? SpecialistId,
    string? SpecialistName,
    Guid? ReceptionistId,
    string? ReceptionistName,
    List<Guid> CompanyIds,
    List<CompanyDto> Companies,
    DateTimeOffset CreatedAt
);

public record CreateUserDto(
    string Username,
    string Password,
    UserRole Role,
    Guid? SpecialistId,
    Guid? ReceptionistId,
    List<Guid>? CompanyIds
);

public record UpdateUserDto(
    string? Password,
    UserRole Role,
    Guid? SpecialistId,
    Guid? ReceptionistId,
    List<Guid>? CompanyIds
);

public record LoginRequestDto(
    string Username,
    string Password
);

public record LoginResponseDto(
    string Token,
    Guid UserId,
    string Username,
    string? ProfileName,
    string Role,
    Guid? SpecialistId,
    Guid? ReceptionistId,
    List<CompanyDto> AssignedCompanies
);
