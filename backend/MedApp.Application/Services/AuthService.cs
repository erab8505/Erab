using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Enums;
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
            .Include(u => u.Specialist)
            .Include(u => u.Receptionist)
            .Include(u => u.UserCompanies)
                .ThenInclude(uc => uc.Company)
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Credenciales inválidas. Por favor verifique su usuario y contraseña.");
        }

        string? profileName = null;
        if (user.Specialist != null)
        {
            profileName = user.Specialist.FullName;
        }
        else if (user.Receptionist != null)
        {
            profileName = user.Receptionist.FullName;
        }

        List<CompanyDto> assignedCompanies;

        if (user.Role == UserRole.SuperAdmin)
        {
            // SuperAdmins can access all active companies in the platform
            var allCompanies = await _context.Companies
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();

            assignedCompanies = allCompanies.Select(c => new CompanyDto(
                c.Id, c.Name, c.TaxId, c.Address, c.Phone, c.Email, c.IsActive, c.Description, c.CreatedAt
            )).ToList();
        }
        else
        {
            // Admins, Specialists, Receptionists and Laboratorists only access their assigned companies
            assignedCompanies = user.UserCompanies
                .Where(uc => uc.Company.IsActive)
                .Select(uc => new CompanyDto(
                    uc.Company.Id, uc.Company.Name, uc.Company.TaxId, uc.Company.Address,
                    uc.Company.Phone, uc.Company.Email, uc.Company.IsActive, uc.Company.Description, uc.Company.CreatedAt
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
            user.Role.ToString(),
            user.SpecialistId,
            user.ReceptionistId,
            assignedCompanies
        );
    }
}
