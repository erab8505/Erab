using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class AreaService : IAreaService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;

    public AreaService(IApplicationDbContext context, ICompanyContext companyContext)
    {
        _context = context;
        _companyContext = companyContext;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<AreaDto>> GetAreasAsync()
    {
        return await _context.Areas
            .OrderBy(a => a.Name)
            .Select(a => new AreaDto(a.Id, a.CompanyId, a.Name, a.Description, a.CreatedAt))
            .ToListAsync();
    }

    public async Task<AreaDto> GetAreaByIdAsync(Guid id)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area == null)
            throw new NotFoundException("Área", id);

        return new AreaDto(area.Id, area.CompanyId, area.Name, area.Description, area.CreatedAt);
    }

    public async Task<AreaDto> CreateAreaAsync(CreateAreaDto dto)
    {
        var area = new Area
        {
            CompanyId = CurrentCompanyId,
            Name = dto.Name,
            Description = dto.Description
        };

        await _context.Areas.AddAsync(area);
        await _context.SaveChangesAsync();

        return new AreaDto(area.Id, area.CompanyId, area.Name, area.Description, area.CreatedAt);
    }

    public async Task<AreaDto> UpdateAreaAsync(Guid id, UpdateAreaDto dto)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area == null)
            throw new NotFoundException("Área", id);

        area.Name = dto.Name;
        area.Description = dto.Description;

        await _context.SaveChangesAsync();

        return new AreaDto(area.Id, area.CompanyId, area.Name, area.Description, area.CreatedAt);
    }

    public async Task<bool> DeleteAreaAsync(Guid id)
    {
        var area = await _context.Areas
            .Include(a => a.Specialties)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (area == null)
            throw new NotFoundException("Área", id);

        if (area.Specialties.Any())
        {
            throw new ConflictException("No se puede eliminar el área porque contiene especialidades asociadas.");
        }

        _context.Areas.Remove(area);
        await _context.SaveChangesAsync();
        return true;
    }
}
