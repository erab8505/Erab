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
    private readonly IAuditService _auditService;

    public UserService(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUserService,
        ICompanyContext companyContext,
        IAuditService auditService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
        _companyContext = companyContext;
        _auditService = auditService;
    }

    public async Task<List<UserDto>> GetUsersAsync()
    {
        var query = _context.Users
            .Include(u => u.Employee)
            .Include(u => u.UserRoles)
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

        var users = await query
            .OrderBy(u => u.Username)
            .ToListAsync();

        return users.Select(u => new UserDto(
            u.Id,
            u.Username,
            u.UserRoles.Select(ur => ur.Role).ToList(),
            u.EmployeeId,
            u.Employee != null ? u.Employee.FullName : null,
            u.Employee != null ? u.Employee.JobTitle : null,
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
        )).ToList();
    }

    public async Task<UserDto> GetUserByIdAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Employee)
            .Include(u => u.UserRoles)
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
            user.UserRoles.Select(ur => ur.Role).ToList(),
            user.EmployeeId,
            user.Employee != null ? user.Employee.FullName : null,
            user.Employee != null ? user.Employee.JobTitle : null,
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
        var roles = dto.Roles?.Distinct().ToList() ?? new List<UserRole>();
        if (!roles.Any())
        {
            roles.Add(UserRole.Receptionist);
        }

        if (!_currentUserService.IsSuperAdmin && roles.Contains(UserRole.SuperAdmin))
        {
            throw new ForbiddenAccessException("Solo un Super Administrador puede crear otros Super Administradores.");
        }

        var existsUsername = await _context.Users.AnyAsync(u => u.Username == dto.Username);
        if (existsUsername)
            throw new ConflictException($"El nombre de usuario '{dto.Username}' ya está en uso.");

        Guid? employeeId = null;
        if (dto.EmployeeId.HasValue)
        {
            var employee = await _context.Employees.FindAsync(dto.EmployeeId.Value);
            if (employee == null)
                throw new NotFoundException("Colaborador", dto.EmployeeId.Value);
            employeeId = dto.EmployeeId.Value;
        }

        var user = new User
        {
            Username = dto.Username.Trim(),
            PasswordHash = _passwordHasher.HashPassword(dto.Password),
            EmployeeId = employeeId
        };

        foreach (var role in roles)
        {
            user.UserRoles.Add(new UserRoleAssignment
            {
                UserId = user.Id,
                Role = role
            });
        }

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

        var rolesStr = string.Join(", ", roles);
        await _auditService.LogAsync(
            "CREATE",
            "Users",
            user.Id.ToString(),
            $"Creó el usuario '{user.Username}' con roles [{rolesStr}]",
            new { user.Username, Roles = roles, EmployeeId = employeeId, CompanyIds = companyIdsToAssign }
        );

        // Reload with companies and employee
        return await GetUserByIdAsync(user.Id);
    }

    public async Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Employee)
            .Include(u => u.UserRoles)
            .Include(u => u.UserCompanies)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            throw new NotFoundException("Usuario", id);

        var currentRoles = user.UserRoles.Select(r => r.Role).ToList();
        var newRoles = dto.Roles?.Distinct().ToList() ?? currentRoles;

        if (!_currentUserService.IsSuperAdmin)
        {
            if (currentRoles.Contains(UserRole.SuperAdmin) || newRoles.Contains(UserRole.SuperAdmin))
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

        Guid? employeeId = null;
        if (dto.EmployeeId.HasValue)
        {
            var employee = await _context.Employees.FindAsync(dto.EmployeeId.Value);
            if (employee == null)
                throw new NotFoundException("Colaborador", dto.EmployeeId.Value);
            employeeId = dto.EmployeeId.Value;
        }

        user.EmployeeId = employeeId;

        // Synchronize UserRoles safely without clearing
        var rolesToRemove = user.UserRoles.Where(ur => !newRoles.Contains(ur.Role)).ToList();
        foreach (var ur in rolesToRemove)
        {
            _context.UserRoles.Remove(ur);
        }

        var existingRoleEnums = user.UserRoles.Select(ur => ur.Role).ToHashSet();
        foreach (var r in newRoles)
        {
            if (!existingRoleEnums.Contains(r))
            {
                var newRoleAssignment = new UserRoleAssignment
                {
                    UserId = user.Id,
                    Role = r
                };
                _context.UserRoles.Add(newRoleAssignment);
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(dto.Password);
        }

        // Synchronize company memberships safely without clearing
        if (dto.CompanyIds != null)
        {
            var newCompanyIds = dto.CompanyIds.Distinct().ToHashSet();
            var companiesToRemove = user.UserCompanies.Where(uc => !newCompanyIds.Contains(uc.CompanyId)).ToList();
            foreach (var uc in companiesToRemove)
            {
                _context.UserCompanies.Remove(uc);
            }

            var existingCompanyIds = user.UserCompanies.Select(uc => uc.CompanyId).ToHashSet();
            foreach (var companyId in newCompanyIds)
            {
                if (!existingCompanyIds.Contains(companyId))
                {
                    var newUc = new UserCompany
                    {
                        UserId = user.Id,
                        CompanyId = companyId
                    };
                    _context.UserCompanies.Add(newUc);
                }
            }
        }

        await _context.SaveChangesAsync();

        var rolesStr = string.Join(", ", newRoles);
        await _auditService.LogAsync(
            "UPDATE",
            "Users",
            user.Id.ToString(),
            $"Actualizó el usuario '{user.Username}' (Roles: [{rolesStr}])",
            new { user.Username, Roles = newRoles, EmployeeId = employeeId }
        );

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .Include(u => u.UserCompanies)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            throw new NotFoundException("Usuario", id);

        var isSuperAdmin = user.UserRoles.Any(r => r.Role == UserRole.SuperAdmin);

        if (!_currentUserService.IsSuperAdmin)
        {
            if (isSuperAdmin)
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

        var username = user.Username;
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "DELETE",
            "Users",
            id.ToString(),
            $"Eliminó el usuario '{username}'"
        );

        return true;
    }
}
