using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public record UserDto(
    Guid Id,
    string Username,
    List<UserRole> Roles,
    Guid? EmployeeId,
    string? EmployeeName,
    string? EmployeeJobTitle,
    List<Guid> CompanyIds,
    List<CompanyDto> Companies,
    DateTimeOffset CreatedAt
);

public record CreateUserDto(
    string Username,
    string Password,
    List<UserRole> Roles,
    Guid? EmployeeId,
    List<Guid>? CompanyIds
);

public record UpdateUserDto(
    string? Password,
    List<UserRole> Roles,
    Guid? EmployeeId,
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
    List<string> Roles,
    Guid? EmployeeId,
    List<CompanyDto> AssignedCompanies
);
