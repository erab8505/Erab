using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICompanyContext _companyContext;

    public UserService(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUserService,
        ICompanyContext companyContext)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
        _companyContext = companyContext;
    }

    public async Task<List<UserDto>> GetUsersAsync()
    {
        var query = _context.Users
            .Include(u => u.Specialist)
            .Include(u => u.UserCompanies)
                .ThenInclude(uc => uc.Company)
            .AsQueryable();

        // If not SuperAdmin, restrict users to the active company or the user's assigned companies
        if (!_currentUserService.IsSuperAdmin)
        {
            if (_companyContext.CompanyId.HasValue)
            {
                var currentCompanyId = _companyContext.CompanyId.Value;
                query = query.Where(u => u.UserCompanies.Any(uc => uc.CompanyId == currentCompanyId));
            }
            else if (_currentUserService.UserId.HasValue)
            {
                var myCompanyIds = await _context.UserCompanies
                    .Where(uc => uc.UserId == _currentUserService.UserId.Value)
                    .Select(uc => uc.CompanyId)
                    .ToListAsync();

                query = query.Where(u => u.UserCompanies.Any(uc => myCompanyIds.Contains(uc.CompanyId)));
            }
        }

        return await query
            .OrderBy(u => u.Username)
            .Select(u => new UserDto(
                u.Id,
                u.Username,
                u.Role,
                u.SpecialistId,
                u.Specialist != null ? $"{u.Specialist.FirstName} {u.Specialist.LastName}" : null,
                u.UserCompanies.Select(uc => uc.CompanyId).ToList(),
                u.UserCompanies.Select(uc => new CompanyDto(
                    uc.Company.Id,
                    uc.Company.Name,
                    uc.Company.TaxId,
                    uc.Company.Address,
                    uc.Company.Phone,
                    uc.Company.Email,
                    uc.Company.IsActive,
                    uc.Company.Description,
                    uc.Company.CreatedAt
                )).ToList(),
                u.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<UserDto> GetUserByIdAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Specialist)
            .Include(u => u.UserCompanies)
                .ThenInclude(uc => uc.Company)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            throw new NotFoundException("Usuario", id);

        // Security check for non-SuperAdmins
        if (!_currentUserService.IsSuperAdmin)
        {
            var hasAccess = false;
            if (_companyContext.CompanyId.HasValue)
            {
                hasAccess = user.UserCompanies.Any(uc => uc.CompanyId == _companyContext.CompanyId.Value);
            }
            else if (_currentUserService.UserId.HasValue)
            {
                var myCompanyIds = await _context.UserCompanies
                    .Where(uc => uc.UserId == _currentUserService.UserId.Value)
                    .Select(uc => uc.CompanyId)
                    .ToListAsync();

                hasAccess = user.UserCompanies.Any(uc => myCompanyIds.Contains(uc.CompanyId));
            }

            if (!hasAccess)
            {
                throw new NotFoundException("Usuario", id);
            }
        }

        return new UserDto(
            user.Id,
            user.Username,
            user.Role,
            user.SpecialistId,
            user.Specialist != null ? $"{user.Specialist.FirstName} {user.Specialist.LastName}" : null,
            user.UserCompanies.Select(uc => uc.CompanyId).ToList(),
            user.UserCompanies.Select(uc => new CompanyDto(
                uc.Company.Id,
                uc.Company.Name,
                uc.Company.TaxId,
                uc.Company.Address,
                uc.Company.Phone,
                uc.Company.Email,
                uc.Company.IsActive,
                uc.Company.Description,
                uc.Company.CreatedAt
            )).ToList(),
            user.CreatedAt
        );
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
    {
        if (!_currentUserService.IsSuperAdmin && dto.Role == UserRole.SuperAdmin)
        {
            throw new ForbiddenAccessException("Solo un Super Administrador puede crear otros Super Administradores.");
        }

        var existsUsername = await _context.Users.AnyAsync(u => u.Username == dto.Username);
        if (existsUsername)
            throw new ConflictException($"El nombre de usuario '{dto.Username}' ya está en uso.");

        string? specialistName = null;
        if (dto.SpecialistId.HasValue)
        {
            var specialist = await _context.Specialists.FindAsync(dto.SpecialistId.Value);
            if (specialist == null)
                throw new NotFoundException("Especialista", dto.SpecialistId.Value);
            specialistName = $"{specialist.FirstName} {specialist.LastName}";
        }

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = _passwordHasher.HashPassword(dto.Password),
            Role = dto.Role,
            SpecialistId = dto.SpecialistId
        };

        var companyIdsToAssign = dto.CompanyIds?.Distinct().ToList() ?? new List<Guid>();

        // If non-SuperAdmin and no company specified, default to active company
        if (!_currentUserService.IsSuperAdmin && !companyIdsToAssign.Any() && _companyContext.CompanyId.HasValue)
        {
            companyIdsToAssign.Add(_companyContext.CompanyId.Value);
        }

        foreach (var companyId in companyIdsToAssign)
        {
            user.UserCompanies.Add(new UserCompany
            {
                UserId = user.Id,
                CompanyId = companyId
            });
        }

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Reload with companies
        return await GetUserByIdAsync(user.Id);
    }

    public async Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Specialist)
            .Include(u => u.UserCompanies)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            throw new NotFoundException("Usuario", id);

        if (!_currentUserService.IsSuperAdmin)
        {
            if (user.Role == UserRole.SuperAdmin || dto.Role == UserRole.SuperAdmin)
            {
                throw new ForbiddenAccessException("No tiene permisos para modificar roles de Super Administrador.");
            }

            var hasAccess = false;
            if (_companyContext.CompanyId.HasValue)
            {
                hasAccess = user.UserCompanies.Any(uc => uc.CompanyId == _companyContext.CompanyId.Value);
            }
            else if (_currentUserService.UserId.HasValue)
            {
                var myCompanyIds = await _context.UserCompanies
                    .Where(uc => uc.UserId == _currentUserService.UserId.Value)
                    .Select(uc => uc.CompanyId)
                    .ToListAsync();

                hasAccess = user.UserCompanies.Any(uc => myCompanyIds.Contains(uc.CompanyId));
            }

            if (!hasAccess)
            {
                throw new NotFoundException("Usuario", id);
            }
        }

        string? specialistName = null;
        if (dto.SpecialistId.HasValue)
        {
            var specialist = await _context.Specialists.FindAsync(dto.SpecialistId.Value);
            if (specialist == null)
                throw new NotFoundException("Especialista", dto.SpecialistId.Value);
            specialistName = $"{specialist.FirstName} {specialist.LastName}";
        }

        user.Role = dto.Role;
        user.SpecialistId = dto.SpecialistId;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(dto.Password);
        }

        // Update company memberships
        if (dto.CompanyIds != null)
        {
            user.UserCompanies.Clear();
            foreach (var companyId in dto.CompanyIds.Distinct())
            {
                user.UserCompanies.Add(new UserCompany
                {
                    UserId = user.Id,
                    CompanyId = companyId
                });
            }
        }

        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.UserCompanies)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            throw new NotFoundException("Usuario", id);

        if (!_currentUserService.IsSuperAdmin)
        {
            if (user.Role == UserRole.SuperAdmin)
            {
                throw new ForbiddenAccessException("No tiene permisos para eliminar a un Super Administrador.");
            }

            var hasAccess = false;
            if (_companyContext.CompanyId.HasValue)
            {
                hasAccess = user.UserCompanies.Any(uc => uc.CompanyId == _companyContext.CompanyId.Value);
            }
            else if (_currentUserService.UserId.HasValue)
            {
                var myCompanyIds = await _context.UserCompanies
                    .Where(uc => uc.UserId == _currentUserService.UserId.Value)
                    .Select(uc => uc.CompanyId)
                    .ToListAsync();

                hasAccess = user.UserCompanies.Any(uc => myCompanyIds.Contains(uc.CompanyId));
            }

            if (!hasAccess)
            {
                throw new NotFoundException("Usuario", id);
            }
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }
}
