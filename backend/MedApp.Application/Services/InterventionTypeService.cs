using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class InterventionTypeService : IInterventionTypeService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;

    public InterventionTypeService(IApplicationDbContext context, ICompanyContext companyContext)
    {
        _context = context;
        _companyContext = companyContext;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<InterventionTypeDto>> GetInterventionTypesAsync(Guid? specialtyId = null, bool? activeOnly = null)
    {
        var query = _context.InterventionTypes
            .Include(i => i.Specialty)
            .AsQueryable();

        if (specialtyId.HasValue)
        {
            query = query.Where(i => i.SpecialtyId == specialtyId.Value);
        }

        if (activeOnly.HasValue)
        {
            query = query.Where(i => i.IsActive == activeOnly.Value);
        }

        return await query
            .OrderBy(i => i.Name)
            .Select(i => new InterventionTypeDto(
                i.Id, i.SpecialtyId, i.Specialty.Name, i.CompanyId,
                i.Name, i.Code, i.Description, i.DurationMinutes,
                i.RequiresAnesthesia, i.RequiresHospitalization, i.IsActive, i.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<InterventionTypeDto> GetInterventionTypeByIdAsync(Guid id)
    {
        var i = await _context.InterventionTypes
            .Include(it => it.Specialty)
            .FirstOrDefaultAsync(it => it.Id == id);

        if (i == null)
            throw new NotFoundException("Procedimiento / Tipo de Intervención", id);

        return new InterventionTypeDto(
            i.Id, i.SpecialtyId, i.Specialty.Name, i.CompanyId,
            i.Name, i.Code, i.Description, i.DurationMinutes,
            i.RequiresAnesthesia, i.RequiresHospitalization, i.IsActive, i.CreatedAt
        );
    }

    public async Task<InterventionTypeDto> CreateInterventionTypeAsync(CreateInterventionTypeDto dto)
    {
        var specialty = await _context.Specialties.FindAsync(dto.SpecialtyId);
        if (specialty == null || specialty.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"La especialidad ({dto.SpecialtyId}) no pertenece a la empresa activa.");

        if (!string.IsNullOrWhiteSpace(dto.Code))
        {
            var existsCode = await _context.InterventionTypes
                .AnyAsync(i => i.CompanyId == CurrentCompanyId && i.Code == dto.Code);

            if (existsCode)
                throw new ConflictException($"Ya existe un procedimiento con el código '{dto.Code}' en esta empresa.");
        }

        var intervention = new InterventionType
        {
            CompanyId = CurrentCompanyId,
            SpecialtyId = dto.SpecialtyId,
            Name = dto.Name,
            Code = dto.Code,
            Description = dto.Description,
            DurationMinutes = dto.DurationMinutes,
            RequiresAnesthesia = dto.RequiresAnesthesia,
            RequiresHospitalization = dto.RequiresHospitalization,
            IsActive = dto.IsActive
        };

        await _context.InterventionTypes.AddAsync(intervention);
        await _context.SaveChangesAsync();

        return new InterventionTypeDto(
            intervention.Id, intervention.SpecialtyId, specialty.Name, intervention.CompanyId,
            intervention.Name, intervention.Code, intervention.Description,
            intervention.DurationMinutes, intervention.RequiresAnesthesia,
            intervention.RequiresHospitalization, intervention.IsActive, intervention.CreatedAt
        );
    }

    public async Task<InterventionTypeDto> UpdateInterventionTypeAsync(Guid id, UpdateInterventionTypeDto dto)
    {
        var intervention = await _context.InterventionTypes
            .Include(i => i.Specialty)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (intervention == null)
            throw new NotFoundException("Procedimiento / Tipo de Intervención", id);

        var specialty = await _context.Specialties.FindAsync(dto.SpecialtyId);
        if (specialty == null || specialty.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"La especialidad ({dto.SpecialtyId}) no pertenece a la empresa activa.");

        if (!string.IsNullOrWhiteSpace(dto.Code) && dto.Code != intervention.Code)
        {
            var existsCode = await _context.InterventionTypes
                .AnyAsync(i => i.CompanyId == CurrentCompanyId && i.Code == dto.Code && i.Id != id);

            if (existsCode)
                throw new ConflictException($"Ya existe otro procedimiento con el código '{dto.Code}' en esta empresa.");
        }

        intervention.SpecialtyId = dto.SpecialtyId;
        intervention.Name = dto.Name;
        intervention.Code = dto.Code;
        intervention.Description = dto.Description;
        intervention.DurationMinutes = dto.DurationMinutes;
        intervention.RequiresAnesthesia = dto.RequiresAnesthesia;
        intervention.RequiresHospitalization = dto.RequiresHospitalization;
        intervention.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return new InterventionTypeDto(
            intervention.Id, intervention.SpecialtyId, specialty.Name, intervention.CompanyId,
            intervention.Name, intervention.Code, intervention.Description,
            intervention.DurationMinutes, intervention.RequiresAnesthesia,
            intervention.RequiresHospitalization, intervention.IsActive, intervention.CreatedAt
        );
    }

    public async Task<bool> DeleteInterventionTypeAsync(Guid id)
    {
        var intervention = await _context.InterventionTypes
            .Include(i => i.Schedulings)
            .Include(i => i.MedicalRecords)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (intervention == null)
            throw new NotFoundException("Procedimiento", id);

        if (intervention.Schedulings.Any() || intervention.MedicalRecords.Any())
        {
            throw new ConflictException("No se puede eliminar el procedimiento porque registra citas o historias clínicas asociadas. Puede desactivarlo en su lugar.");
        }

        _context.InterventionTypes.Remove(intervention);
        await _context.SaveChangesAsync();
        return true;
    }
}
