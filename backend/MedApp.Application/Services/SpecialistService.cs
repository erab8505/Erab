using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class SpecialistService : ISpecialistService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;
    private readonly ICurrentUserService _currentUserService;

    public SpecialistService(
        IApplicationDbContext context,
        ICompanyContext companyContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _companyContext = companyContext;
        _currentUserService = currentUserService;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<SpecialistDto>> GetSpecialistsAsync(Guid? specialtyId = null, bool? activeOnly = null)
    {
        var query = _context.Specialists
            .Include(s => s.Specialty)
            .AsQueryable();

        // If the logged-in user is a specialist, strictly return only their own specialist profile
        if (_currentUserService.IsSpecialist)
        {
            if (!_currentUserService.SpecialistId.HasValue)
            {
                return new List<SpecialistDto>();
            }
            query = query.Where(s => s.Id == _currentUserService.SpecialistId.Value);
        }

        if (specialtyId.HasValue)
        {
            query = query.Where(s => s.SpecialtyId == specialtyId.Value);
        }

        if (activeOnly.HasValue)
        {
            query = query.Where(s => s.IsActive == activeOnly.Value);
        }

        return await query
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .Select(s => new SpecialistDto(
                s.Id, s.SpecialtyId, s.Specialty.Name, s.CompanyId,
                s.FirstName, s.LastName, s.LicenseNumber, s.Email, s.Phone, s.IsActive, s.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<SpecialistDto> GetSpecialistByIdAsync(Guid id)
    {
        if (_currentUserService.IsSpecialist && id != _currentUserService.SpecialistId)
            throw new NotFoundException("Especialista", id);

        var s = await _context.Specialists
            .Include(sp => sp.Specialty)
            .FirstOrDefaultAsync(sp => sp.Id == id);

        if (s == null)
            throw new NotFoundException("Especialista", id);

        return new SpecialistDto(
            s.Id, s.SpecialtyId, s.Specialty.Name, s.CompanyId,
            s.FirstName, s.LastName, s.LicenseNumber, s.Email, s.Phone, s.IsActive, s.CreatedAt
        );
    }

    public async Task<SpecialistDto> CreateSpecialistAsync(CreateSpecialistDto dto)
    {
        var specialty = await _context.Specialties.FindAsync(dto.SpecialtyId);
        if (specialty == null || specialty.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"La especialidad ({dto.SpecialtyId}) no pertenece a la empresa activa.");

        var existsLicense = await _context.Specialists
            .AnyAsync(s => s.CompanyId == CurrentCompanyId && s.LicenseNumber == dto.LicenseNumber);

        if (existsLicense)
            throw new ConflictException($"Ya existe un especialista registrado con la matrícula / cédula '{dto.LicenseNumber}' en esta empresa.");

        var specialist = new Specialist
        {
            CompanyId = CurrentCompanyId,
            SpecialtyId = dto.SpecialtyId,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            LicenseNumber = dto.LicenseNumber,
            Email = dto.Email,
            Phone = dto.Phone,
            IsActive = dto.IsActive
        };

        await _context.Specialists.AddAsync(specialist);
        await _context.SaveChangesAsync();

        return new SpecialistDto(
            specialist.Id, specialist.SpecialtyId, specialty.Name, specialist.CompanyId,
            specialist.FirstName, specialist.LastName, specialist.LicenseNumber,
            specialist.Email, specialist.Phone, specialist.IsActive, specialist.CreatedAt
        );
    }

    public async Task<SpecialistDto> UpdateSpecialistAsync(Guid id, UpdateSpecialistDto dto)
    {
        var specialist = await _context.Specialists
            .Include(s => s.Specialty)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (specialist == null)
            throw new NotFoundException("Especialista", id);

        var specialty = await _context.Specialties.FindAsync(dto.SpecialtyId);
        if (specialty == null || specialty.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"La especialidad ({dto.SpecialtyId}) no pertenece a la empresa activa.");

        if (specialist.LicenseNumber != dto.LicenseNumber)
        {
            var existsLicense = await _context.Specialists
                .AnyAsync(s => s.CompanyId == CurrentCompanyId && s.LicenseNumber == dto.LicenseNumber && s.Id != id);

            if (existsLicense)
                throw new ConflictException($"Ya existe otro especialista con la matrícula '{dto.LicenseNumber}' en esta empresa.");
        }

        specialist.SpecialtyId = dto.SpecialtyId;
        specialist.FirstName = dto.FirstName;
        specialist.LastName = dto.LastName;
        specialist.LicenseNumber = dto.LicenseNumber;
        specialist.Email = dto.Email;
        specialist.Phone = dto.Phone;
        specialist.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return new SpecialistDto(
            specialist.Id, specialist.SpecialtyId, specialty.Name, specialist.CompanyId,
            specialist.FirstName, specialist.LastName, specialist.LicenseNumber,
            specialist.Email, specialist.Phone, specialist.IsActive, specialist.CreatedAt
        );
    }

    public async Task<bool> DeleteSpecialistAsync(Guid id)
    {
        var specialist = await _context.Specialists
            .Include(s => s.Schedulings)
            .Include(s => s.Prescriptions)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (specialist == null)
            throw new NotFoundException("Especialista", id);

        if (specialist.Schedulings.Any() || specialist.Prescriptions.Any())
        {
            throw new ConflictException("No se puede eliminar el especialista porque registra citas o prescripciones. Puede desactivar su perfil en su lugar.");
        }

        _context.Specialists.Remove(specialist);
        await _context.SaveChangesAsync();
        return true;
    }
}
