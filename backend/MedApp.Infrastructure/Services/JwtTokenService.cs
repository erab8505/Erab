using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using MedApp.Application.Common.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MedApp.Infrastructure.Services;

public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user, IEnumerable<Guid> companyIds)
    {
        var secret = _configuration["Jwt:Secret"] ?? "MedAppSuperSecretKeyForDevelopmentAndTestingPurposesOnly2026!";
        var issuer = _configuration["Jwt:Issuer"] ?? "MedAppApi";
        var audience = _configuration["Jwt:Audience"] ?? "MedAppClient";
        var expiryHoursStr = _configuration["Jwt:ExpiryHours"] ?? "12";
        var expiryHours = double.TryParse(expiryHoursStr, out var h) ? h : 12;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new("companyIds", JsonSerializer.Serialize(companyIds))
        };

        var roles = user.UserRoles?.Select(r => r.Role).ToList() ?? new List<UserRole>();
        if (!roles.Any())
        {
            roles.Add(UserRole.Receptionist);
        }

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.ToString()));
            claims.Add(new Claim("role", role.ToString()));
        }

        if (user.EmployeeId.HasValue)
        {
            claims.Add(new Claim("employeeId", user.EmployeeId.Value.ToString()));
            // Backwards compatibility claims
            claims.Add(new Claim("specialistId", user.EmployeeId.Value.ToString()));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(expiryHours),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
