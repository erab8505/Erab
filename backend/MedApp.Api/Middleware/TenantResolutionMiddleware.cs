using System.Security.Claims;
using System.Text.Json;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.Common.Models;

namespace MedApp.Api.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ICompanyContext companyContext)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;

        // Skip tenant resolution for Swagger, health checks, login, and global company endpoints
        if (path.StartsWith("/swagger") ||
            path.StartsWith("/api/health") ||
            path.StartsWith("/api/auth/login") ||
            path.Equals("/api/companies/mine", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        string? headerValue = null;
        if (context.Request.Headers.TryGetValue("X-Company-Id", out var companyIdHeader))
        {
            headerValue = companyIdHeader.ToString().Trim();
        }
        else if (context.Request.Query.TryGetValue("companyId", out var companyIdQuery))
        {
            headerValue = companyIdQuery.ToString().Trim();
        }
        else if (context.Request.Query.TryGetValue("X-Company-Id", out var xCompanyIdQuery))
        {
            headerValue = xCompanyIdQuery.ToString().Trim();
        }

        if (!string.IsNullOrEmpty(headerValue))
        {
            if (!Guid.TryParse(headerValue, out var companyId))
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(ApiResponse.Fail("Invalid X-Company-Id header format."));
                return;
            }

                // If user is authenticated, verify company membership
                if (context.User.Identity?.IsAuthenticated == true)
                {
                    var role = context.User.FindFirstValue(ClaimTypes.Role) ?? context.User.FindFirstValue("role");
                    var isAdmin = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);

                    if (!isAdmin)
                    {
                        var companyIdsClaim = context.User.FindFirstValue("companyIds");
                        var allowedCompanies = new List<Guid>();

                        if (!string.IsNullOrEmpty(companyIdsClaim))
                        {
                            try
                            {
                                allowedCompanies = JsonSerializer.Deserialize<List<Guid>>(companyIdsClaim) ?? new List<Guid>();
                            }
                            catch
                            {
                                // Error deserializing company claim
                            }
                        }

                        if (!allowedCompanies.Contains(companyId))
                        {
                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                            context.Response.ContentType = "application/json";
                            await context.Response.WriteAsJsonAsync(ApiResponse.Fail("Access denied: You do not have access to the specified company."));
                            return;
                        }
                    }
                }

            companyContext.SetCompany(companyId);
        }

        await _next(context);
    }
}

