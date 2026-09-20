using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace MedApp.Infrastructure.Security;

public class SpecialistSelfRequirement : IAuthorizationRequirement
{
}

public class SpecialistSelfHandler : AuthorizationHandler<SpecialistSelfRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public SpecialistSelfHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, SpecialistSelfRequirement requirement)
    {
        var role = context.User.FindFirstValue(ClaimTypes.Role) ?? context.User.FindFirstValue("role");

        // Admins always fulfill the requirement
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Specialists must have a specialistId claim
        if (string.Equals(role, "Specialist", StringComparison.OrdinalIgnoreCase))
        {
            var userSpecialistIdStr = context.User.FindFirstValue("specialistId");
            if (Guid.TryParse(userSpecialistIdStr, out var userSpecialistId))
            {
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext != null)
                {
                    var routeData = httpContext.GetRouteData();
                    if (routeData.Values.TryGetValue("specialistId", out var routeSpecialistIdObj) ||
                        routeData.Values.TryGetValue("id", out routeSpecialistIdObj))
                    {
                        if (Guid.TryParse(routeSpecialistIdObj?.ToString(), out var routeSpecialistId))
                        {
                            if (userSpecialistId == routeSpecialistId)
                            {
                                context.Succeed(requirement);
                                return Task.CompletedTask;
                            }
                        }
                    }
                    else
                    {
                        // If no specific route specialist ID is specified, specialist can proceed
                        context.Succeed(requirement);
                        return Task.CompletedTask;
                    }
                }
            }
        }

        return Task.CompletedTask;
    }
}
