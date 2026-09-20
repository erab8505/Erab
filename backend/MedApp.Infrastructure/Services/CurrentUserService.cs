using System.Security.Claims;
using MedApp.Application.Common.Interfaces;
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

    public string? Role => User?.FindFirstValue(ClaimTypes.Role) ?? User?.FindFirstValue("role");

    public Guid? SpecialistId
    {
        get
        {
            var specialistIdStr = User?.FindFirstValue("specialistId");
            return Guid.TryParse(specialistIdStr, out var id) ? id : null;
        }
    }

    public bool IsAdmin => string.Equals(Role, "Admin", StringComparison.OrdinalIgnoreCase);

    public bool IsSpecialist => string.Equals(Role, "Specialist", StringComparison.OrdinalIgnoreCase);

    public bool IsReceptionist => string.Equals(Role, "Receptionist", StringComparison.OrdinalIgnoreCase);
}
