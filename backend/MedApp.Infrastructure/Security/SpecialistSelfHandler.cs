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
        // SuperAdmins and Admins always fulfill the requirement
        if (context.User.IsInRole("Admin") || context.User.IsInRole("SuperAdmin"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Specialists must have an employeeId / specialistId claim
        if (context.User.IsInRole("Specialist"))
        {
            var userEmpIdStr = context.User.FindFirstValue("employeeId") ?? context.User.FindFirstValue("specialistId");
            if (Guid.TryParse(userEmpIdStr, out var userEmpId))
            {
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext != null)
                {
                    var routeData = httpContext.GetRouteData();
                    if (routeData.Values.TryGetValue("employeeId", out var routeEmpIdObj) ||
                        routeData.Values.TryGetValue("specialistId", out routeEmpIdObj) ||
                        routeData.Values.TryGetValue("id", out routeEmpIdObj))
                    {
                        if (Guid.TryParse(routeEmpIdObj?.ToString(), out var routeEmpId))
                        {
                            if (userEmpId == routeEmpId)
                            {
                                context.Succeed(requirement);
                                return Task.CompletedTask;
                            }
                        }
                    }
                    else
                    {
                        // If no specific route ID is specified, specialist can proceed
                        context.Succeed(requirement);
                        return Task.CompletedTask;
                    }
                }
            }
        }

        return Task.CompletedTask;
    }
}
