using MedApp.Domain.Enums;

namespace MedApp.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Username { get; }
    IReadOnlyList<UserRole> Roles { get; }
    Guid? EmployeeId { get; }

    // Compatibility alias
    Guid? SpecialistId => EmployeeId;

    bool IsSuperAdmin { get; }
    bool IsAdmin { get; }
    bool IsSpecialist { get; }
    bool IsReceptionist { get; }
    bool IsLaboratorist { get; }

    bool HasRole(UserRole role);
}
