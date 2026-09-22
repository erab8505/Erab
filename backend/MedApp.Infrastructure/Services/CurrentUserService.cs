using System.Security.Claims;
using MedApp.Application.Common.Interfaces;
using MedApp.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace MedApp.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var userIdStr = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub");
            return Guid.TryParse(userIdStr, out var id) ? id : null;
        }
    }

    public string? Username => User?.FindFirstValue(ClaimTypes.Name) ?? User?.FindFirstValue("name") ?? User?.FindFirstValue("unique_name");

    public IReadOnlyList<UserRole> Roles
    {
        get
        {
            if (User == null) return Array.Empty<UserRole>();

            var roleClaims = User.FindAll(ClaimTypes.Role)
                .Concat(User.FindAll("role"))
                .Select(c => c.Value)
                .Distinct();

            var list = new List<UserRole>();
            foreach (var r in roleClaims)
            {
                if (Enum.TryParse<UserRole>(r, true, out var parsedRole))
                {
                    list.Add(parsedRole);
                }
            }

            return list;
        }
    }

    public Guid? EmployeeId
    {
        get
        {
            var empIdStr = User?.FindFirstValue("employeeId") 
                        ?? User?.FindFirstValue("specialistId")
                        ?? User?.FindFirstValue("receptionistId");
            return Guid.TryParse(empIdStr, out var id) ? id : null;
        }
    }

    public bool HasRole(UserRole role) => Roles.Contains(role);

    public bool IsSuperAdmin => Roles.Contains(UserRole.SuperAdmin);

    public bool IsAdmin => Roles.Contains(UserRole.Admin) || IsSuperAdmin;

    public bool IsSpecialist => Roles.Contains(UserRole.Specialist);

    public bool IsReceptionist => Roles.Contains(UserRole.Receptionist);

    public bool IsLaboratorist => Roles.Contains(UserRole.Laboratorist);
}
