using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Enums;
using MedApp.Domain.Extensions;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthService(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.Employee)
            .Include(u => u.UserRoles)
            .Include(u => u.UserCompanies)
                .ThenInclude(uc => uc.Company)
                    .ThenInclude(c => c.Features)
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Credenciales inválidas. Por favor verifique su usuario y contraseña.");
        }

        string? profileName = user.Employee?.FullName;
        var roles = user.UserRoles.Select(r => r.Role.ToString()).ToList();
        if (!roles.Any())
        {
            roles.Add(UserRole.Receptionist.ToString());
        }

        List<CompanyDto> assignedCompanies;

        if (user.UserRoles.Any(r => r.Role == UserRole.SuperAdmin))
        {
            // SuperAdmins can access all active companies in the platform
            var allCompanies = await _context.Companies
                .Include(c => c.Features)
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();

            assignedCompanies = allCompanies.Select(c => new CompanyDto(
                c.Id, c.Name, c.TaxId, c.Address, c.Phone, c.Email, c.IsActive, c.Description, c.CreatedAt,
                c.Features.ToFeaturesDictionary()
            )).ToList();
        }
        else
        {
            // Users only access their assigned companies
            assignedCompanies = user.UserCompanies
                .Where(uc => uc.Company != null && uc.Company.IsActive)
                .Select(uc => new CompanyDto(
                    uc.Company.Id, uc.Company.Name, uc.Company.TaxId, uc.Company.Address,
                    uc.Company.Phone, uc.Company.Email, uc.Company.IsActive, uc.Company.Description, uc.Company.CreatedAt,
                    uc.Company.Features.ToFeaturesDictionary()
                ))
                .OrderBy(c => c.Name)
                .ToList();
        }

        var companyIds = assignedCompanies.Select(c => c.Id).ToList();
        var token = _tokenService.GenerateToken(user, companyIds);

        return new LoginResponseDto(
            token,
            user.Id,
            user.Username,
            profileName,
            roles,
            user.EmployeeId,
            assignedCompanies
        );
    }
}
