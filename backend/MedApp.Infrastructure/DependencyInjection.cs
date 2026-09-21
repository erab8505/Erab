using System.Text;
using MedApp.Application.Common.Interfaces;
using MedApp.Infrastructure.Data;
using MedApp.Infrastructure.Security;
using MedApp.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace MedApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=MedAppDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;";

        // Tenancy & DbContext
        services.AddHttpContextAccessor();
        services.AddScoped<ICompanyContext, CompanyContext>();

        services.AddDbContext<MedAppDbContext>((sp, options) =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(MedAppDbContext).Assembly.FullName);
                sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
            });
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<MedAppDbContext>());

        // Security & Services
        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        // JWT Authentication Configuration
        var secret = configuration["Jwt:Secret"] ?? "MedAppSuperSecretKeyForDevelopmentAndTestingPurposesOnly2026!";
        var issuer = configuration["Jwt:Issuer"] ?? "MedAppApi";
        var audience = configuration["Jwt:Audience"] ?? "MedAppClient";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"].ToString();
                    if (string.IsNullOrEmpty(accessToken))
                    {
                        accessToken = context.Request.Query["token"].ToString();
                    }

                    if (!string.IsNullOrEmpty(accessToken))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        // Authorization Policies
        services.AddAuthorization(options =>
        {
            options.AddPolicy("RequireSuperAdminRole", policy => policy.RequireRole("SuperAdmin"));
            options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("SuperAdmin", "Admin"));
            options.AddPolicy("RequireClinicalRole", policy => policy.RequireRole("SuperAdmin", "Admin", "Specialist"));
            options.AddPolicy("RequireSpecialistSelfOrAdmin", policy => policy.Requirements.Add(new SpecialistSelfRequirement()));
        });

        services.AddScoped<IAuthorizationHandler, SpecialistSelfHandler>();

        return services;
    }
}
