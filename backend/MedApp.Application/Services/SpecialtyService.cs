using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class SpecialtyService : ISpecialtyService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;

    public SpecialtyService(IApplicationDbContext context, ICompanyContext companyContext)
    {
        _context = context;
        _companyContext = companyContext;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<SpecialtyDto>> GetSpecialtiesAsync(Guid? areaId = null)
    {
        var query = _context.Specialties
            .Include(s => s.Area)
            .AsQueryable();

        if (areaId.HasValue)
        {
            query = query.Where(s => s.AreaId == areaId.Value);
        }

        return await query
            .OrderBy(s => s.Name)
            .Select(s => new SpecialtyDto(
                s.Id, s.AreaId, s.Area.Name, s.CompanyId, s.Name, s.Description, s.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<SpecialtyDto> GetSpecialtyByIdAsync(Guid id)
    {
        var specialty = await _context.Specialties
            .Include(s => s.Area)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (specialty == null)
            throw new NotFoundException("Especialidad", id);

        return new SpecialtyDto(
            specialty.Id, specialty.AreaId, specialty.Area.Name, specialty.CompanyId,
            specialty.Name, specialty.Description, specialty.CreatedAt
        );
    }

    public async Task<SpecialtyDto> CreateSpecialtyAsync(CreateSpecialtyDto dto)
    {
        var area = await _context.Areas.FindAsync(dto.AreaId);
        if (area == null || area.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El área especificada ({dto.AreaId}) no existe en la empresa activa.");

        var specialty = new Specialty
        {
            CompanyId = CurrentCompanyId,
            AreaId = dto.AreaId,
            Name = dto.Name,
            Description = dto.Description
        };

        await _context.Specialties.AddAsync(specialty);
        await _context.SaveChangesAsync();

        return new SpecialtyDto(
            specialty.Id, specialty.AreaId, area.Name, specialty.CompanyId,
            specialty.Name, specialty.Description, specialty.CreatedAt
        );
    }

    public async Task<SpecialtyDto> UpdateSpecialtyAsync(Guid id, UpdateSpecialtyDto dto)
    {
        var specialty = await _context.Specialties
            .Include(s => s.Area)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (specialty == null)
            throw new NotFoundException("Especialidad", id);

        var area = await _context.Areas.FindAsync(dto.AreaId);
        if (area == null || area.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El área especificada ({dto.AreaId}) no existe en la empresa activa.");

        specialty.AreaId = dto.AreaId;
        specialty.Name = dto.Name;
        specialty.Description = dto.Description;

        await _context.SaveChangesAsync();

        return new SpecialtyDto(
            specialty.Id, specialty.AreaId, area.Name, specialty.CompanyId,
            specialty.Name, specialty.Description, specialty.CreatedAt
        );
    }

    public async Task<bool> DeleteSpecialtyAsync(Guid id)
    {
        var specialty = await _context.Specialties
            .Include(s => s.Employees)
            .Include(s => s.InterventionTypes)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (specialty == null)
            throw new NotFoundException("Especialidad", id);

        if (specialty.Employees.Any() || specialty.InterventionTypes.Any())
        {
            throw new ConflictException("No se puede eliminar la especialidad porque contiene colaboradores o procedimientos asociados.");
        }

        _context.Specialties.Remove(specialty);
        await _context.SaveChangesAsync();
        return true;
    }
}
