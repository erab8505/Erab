using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<List<UserDto>> GetUsersAsync()
    {
        return await _context.Users
            .Include(u => u.Specialist)
            .Include(u => u.UserCompanies)
            .OrderBy(u => u.Username)
            .Select(u => new UserDto(
                u.Id,
                u.Username,
                u.Role,
                u.SpecialistId,
                u.Specialist != null ? $"{u.Specialist.FirstName} {u.Specialist.LastName}" : null,
                u.UserCompanies.Select(uc => uc.CompanyId).ToList(),
                u.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<UserDto> GetUserByIdAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Specialist)
            .Include(u => u.UserCompanies)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            throw new NotFoundException("Usuario", id);

        return new UserDto(
            user.Id,
            user.Username,
            user.Role,
            user.SpecialistId,
            user.Specialist != null ? $"{user.Specialist.FirstName} {user.Specialist.LastName}" : null,
            user.UserCompanies.Select(uc => uc.CompanyId).ToList(),
            user.CreatedAt
        );
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
    {
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

        if (dto.CompanyIds != null && dto.CompanyIds.Any())
        {
            foreach (var companyId in dto.CompanyIds.Distinct())
            {
                user.UserCompanies.Add(new UserCompany
                {
                    UserId = user.Id,
                    CompanyId = companyId
                });
            }
        }

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        return new UserDto(
            user.Id,
            user.Username,
            user.Role,
            user.SpecialistId,
            specialistName,
            user.UserCompanies.Select(uc => uc.CompanyId).ToList(),
            user.CreatedAt
        );
    }

    public async Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Specialist)
            .Include(u => u.UserCompanies)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            throw new NotFoundException("Usuario", id);

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

        return new UserDto(
            user.Id,
            user.Username,
            user.Role,
            user.SpecialistId,
            specialistName,
            user.UserCompanies.Select(uc => uc.CompanyId).ToList(),
            user.CreatedAt
        );
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            throw new NotFoundException("Usuario", id);

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }
}
