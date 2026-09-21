using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class ReceptionistService : IReceptionistService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public ReceptionistService(
        IApplicationDbContext context,
        ICompanyContext companyContext,
        ICurrentUserService currentUserService,
        IAuditService auditService)
    {
        _context = context;
        _companyContext = companyContext;
        _currentUserService = currentUserService;
        _auditService = auditService;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<ReceptionistDto>> GetReceptionistsAsync(bool? activeOnly = null)
    {
        var query = _context.Receptionists
            .Include(r => r.Company)
            .AsQueryable();

        if (activeOnly.HasValue)
        {
            query = query.Where(r => r.IsActive == activeOnly.Value);
        }

        return await query
            .OrderBy(r => r.LastName)
            .ThenBy(r => r.FirstName)
            .Select(r => new ReceptionistDto(
                r.Id,
                r.CompanyId,
                r.Company.Name,
                r.FirstName,
                r.LastName,
                r.FullName,
                r.IdentificationNumber,
                r.Email,
                r.Phone,
                r.IsActive,
                r.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<ReceptionistDto> GetReceptionistByIdAsync(Guid id)
    {
        var r = await _context.Receptionists
            .Include(rec => rec.Company)
            .FirstOrDefaultAsync(rec => rec.Id == id);

        if (r == null)
            throw new NotFoundException("Recepcionista", id);

        return new ReceptionistDto(
            r.Id,
            r.CompanyId,
            r.Company.Name,
            r.FirstName,
            r.LastName,
            r.FullName,
            r.IdentificationNumber,
            r.Email,
            r.Phone,
            r.IsActive,
            r.CreatedAt
        );
    }

    public async Task<ReceptionistDto> CreateReceptionistAsync(CreateReceptionistDto dto)
    {
        var companyId = CurrentCompanyId;

        var company = await _context.Companies.FindAsync(companyId);
        if (company == null)
            throw new NotFoundException("Empresa", companyId);

        if (!string.IsNullOrWhiteSpace(dto.IdentificationNumber))
        {
            var exists = await _context.Receptionists
                .AnyAsync(r => r.CompanyId == companyId && r.IdentificationNumber == dto.IdentificationNumber);

            if (exists)
                throw new ConflictException($"Ya existe un recepcionista con la identificación '{dto.IdentificationNumber}' en esta empresa.");
        }

        var receptionist = new Receptionist
        {
            CompanyId = companyId,
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            IdentificationNumber = string.IsNullOrWhiteSpace(dto.IdentificationNumber) ? null : dto.IdentificationNumber.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
            IsActive = dto.IsActive ?? true
        };

        await _context.Receptionists.AddAsync(receptionist);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "CREATE",
            "Receptionists",
            receptionist.Id.ToString(),
            $"Creó el perfil de recepcionista '{receptionist.FullName}' (DNI: {(receptionist.IdentificationNumber ?? "N/A")})",
            receptionist
        );

        return new ReceptionistDto(
            receptionist.Id,
            receptionist.CompanyId,
            company.Name,
            receptionist.FirstName,
            receptionist.LastName,
            receptionist.FullName,
            receptionist.IdentificationNumber,
            receptionist.Email,
            receptionist.Phone,
            receptionist.IsActive,
            receptionist.CreatedAt
        );
    }

    public async Task<ReceptionistDto> UpdateReceptionistAsync(Guid id, UpdateReceptionistDto dto)
    {
        var receptionist = await _context.Receptionists
            .Include(r => r.Company)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (receptionist == null)
            throw new NotFoundException("Recepcionista", id);

        if (!string.IsNullOrWhiteSpace(dto.IdentificationNumber) && dto.IdentificationNumber != receptionist.IdentificationNumber)
        {
            var exists = await _context.Receptionists
                .AnyAsync(r => r.CompanyId == receptionist.CompanyId && r.IdentificationNumber == dto.IdentificationNumber && r.Id != id);

            if (exists)
                throw new ConflictException($"Ya existe otro recepcionista con la identificación '{dto.IdentificationNumber}' en esta empresa.");
        }

        receptionist.FirstName = dto.FirstName.Trim();
        receptionist.LastName = dto.LastName.Trim();
        receptionist.IdentificationNumber = string.IsNullOrWhiteSpace(dto.IdentificationNumber) ? null : dto.IdentificationNumber.Trim();
        receptionist.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        receptionist.Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();
        receptionist.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "UPDATE",
            "Receptionists",
            receptionist.Id.ToString(),
            $"Actualizó el perfil de recepcionista '{receptionist.FullName}'",
            receptionist
        );

        return new ReceptionistDto(
            receptionist.Id,
            receptionist.CompanyId,
            receptionist.Company.Name,
            receptionist.FirstName,
            receptionist.LastName,
            receptionist.FullName,
            receptionist.IdentificationNumber,
            receptionist.Email,
            receptionist.Phone,
            receptionist.IsActive,
            receptionist.CreatedAt
        );
    }

    public async Task<bool> DeleteReceptionistAsync(Guid id)
    {
        var receptionist = await _context.Receptionists
            .FirstOrDefaultAsync(r => r.Id == id);

        if (receptionist == null)
            throw new NotFoundException("Recepcionista", id);

        // Check if linked to any user
        var isLinked = await _context.Users.AnyAsync(u => u.ReceptionistId == id);
        if (isLinked)
        {
            throw new ConflictException("No se puede eliminar el recepcionista porque está vinculado a uno o más usuarios. Puede desactivarlo en su lugar.");
        }

        _context.Receptionists.Remove(receptionist);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "DELETE",
            "Receptionists",
            id.ToString(),
            $"Eliminó el perfil de recepcionista '{receptionist.FullName}'"
        );

        return true;
    }
}
