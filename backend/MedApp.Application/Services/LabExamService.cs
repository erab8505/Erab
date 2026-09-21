using MedApp.Application.Common.Interfaces;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class LabExamService : ILabExamService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;

    public LabExamService(IApplicationDbContext context, ICompanyContext companyContext)
    {
        _context = context;
        _companyContext = companyContext;
    }

    public async Task<ApiResponse<List<LabExamDto>>> GetAllAsync(string? search = null, bool? isActive = null, CancellationToken cancellationToken = default)
    {
        var query = _context.LabExams
            .AsNoTracking()
            .Include(e => e.Parameters)
                .ThenInclude(p => p.LabParameter)
            .AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(e => e.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(e => e.Name.ToLower().Contains(s) || e.Code.ToLower().Contains(s) || (e.Method != null && e.Method.ToLower().Contains(s)));
        }

        var list = await query
            .OrderBy(e => e.Name)
            .Select(e => new LabExamDto
            {
                Id = e.Id,
                Code = e.Code,
                Name = e.Name,
                Description = e.Description,
                SampleType = e.SampleType,
                Method = e.Method,
                TurnaroundHours = e.TurnaroundHours,
                IsActive = e.IsActive,
                CreatedAt = e.CreatedAt,
                Parameters = e.Parameters
                    .OrderBy(p => p.SortOrder)
                    .Select(p => new LabExamParameterItemDto
                    {
                        Id = p.Id,
                        LabParameterId = p.LabParameterId,
                        ParameterCode = p.LabParameter.Code,
                        ParameterName = p.LabParameter.Name,
                        Unit = p.LabParameter.Unit,
                        ValueType = p.LabParameter.ValueType,
                        SortOrder = p.SortOrder,
                        ReferenceRangeMin = p.CustomReferenceMin ?? p.LabParameter.DefaultReferenceMin,
                        ReferenceRangeMax = p.CustomReferenceMax ?? p.LabParameter.DefaultReferenceMax,
                        ReferenceText = p.CustomReferenceText ?? p.LabParameter.DefaultReferenceText,
                        ReagentName = p.LabParameter.DefaultReagentName,
                        ReagentQuantity = p.LabParameter.DefaultReagentQuantity
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<LabExamDto>>.Ok(list);
    }

    public async Task<ApiResponse<LabExamDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await _context.LabExams
            .AsNoTracking()
            .Include(x => x.Parameters)
                .ThenInclude(p => p.LabParameter)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (e == null)
        {
            return ApiResponse<LabExamDto>.Fail("Examen no encontrado.");
        }

        return ApiResponse<LabExamDto>.Ok(new LabExamDto
        {
            Id = e.Id,
            Code = e.Code,
            Name = e.Name,
            Description = e.Description,
            SampleType = e.SampleType,
            Method = e.Method,
            TurnaroundHours = e.TurnaroundHours,
            IsActive = e.IsActive,
            CreatedAt = e.CreatedAt,
            Parameters = e.Parameters
                .OrderBy(p => p.SortOrder)
                .Select(p => new LabExamParameterItemDto
                {
                    Id = p.Id,
                    LabParameterId = p.LabParameterId,
                    ParameterCode = p.LabParameter.Code,
                    ParameterName = p.LabParameter.Name,
                    Unit = p.LabParameter.Unit,
                    ValueType = p.LabParameter.ValueType,
                    SortOrder = p.SortOrder,
                    ReferenceRangeMin = p.CustomReferenceMin ?? p.LabParameter.DefaultReferenceMin,
                    ReferenceRangeMax = p.CustomReferenceMax ?? p.LabParameter.DefaultReferenceMax,
                    ReferenceText = p.CustomReferenceText ?? p.LabParameter.DefaultReferenceText,
                    ReagentName = p.LabParameter.DefaultReagentName,
                    ReagentQuantity = p.LabParameter.DefaultReagentQuantity
                })
                .ToList()
        });
    }

    public async Task<ApiResponse<LabExamDto>> CreateAsync(CreateLabExamDto dto, CancellationToken cancellationToken = default)
    {
        if (_companyContext.CompanyId == null)
        {
            return ApiResponse<LabExamDto>.Fail("Contexto de empresa no establecido.");
        }

        var exists = await _context.LabExams
            .AnyAsync(e => e.CompanyId == _companyContext.CompanyId.Value && e.Code.ToLower() == dto.Code.Trim().ToLower(), cancellationToken);

        if (exists)
        {
            return ApiResponse<LabExamDto>.Fail($"Ya existe un examen con el código '{dto.Code}'.");
        }

        var entity = new LabExam
        {
            CompanyId = _companyContext.CompanyId.Value,
            Code = dto.Code.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            SampleType = dto.SampleType,
            Method = dto.Method?.Trim(),
            TurnaroundHours = dto.TurnaroundHours,
            IsActive = true
        };

        int order = 0;
        foreach (var p in dto.Parameters)
        {
            entity.Parameters.Add(new LabExamParameter
            {
                LabParameterId = p.LabParameterId,
                SortOrder = p.SortOrder > 0 ? p.SortOrder : ++order,
                CustomReferenceMin = p.CustomReferenceMin,
                CustomReferenceMax = p.CustomReferenceMax,
                CustomReferenceText = p.CustomReferenceText?.Trim()
            });
        }

        _context.LabExams.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<ApiResponse<LabExamDto>> UpdateAsync(Guid id, UpdateLabExamDto dto, CancellationToken cancellationToken = default)
    {
        if (_companyContext.CompanyId == null)
        {
            return ApiResponse<LabExamDto>.Fail("Contexto de empresa no establecido.");
        }

        var entity = await _context.LabExams
            .Include(e => e.Parameters)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity == null)
        {
            return ApiResponse<LabExamDto>.Fail("Examen no encontrado.");
        }

        var exists = await _context.LabExams
            .AnyAsync(e => e.Id != id && e.CompanyId == _companyContext.CompanyId.Value && e.Code.ToLower() == dto.Code.Trim().ToLower(), cancellationToken);

        if (exists)
        {
            return ApiResponse<LabExamDto>.Fail($"Ya existe otro examen con el código '{dto.Code}'.");
        }

        entity.Code = dto.Code.Trim().ToUpper();
        entity.Name = dto.Name.Trim();
        entity.Description = dto.Description?.Trim();
        entity.SampleType = dto.SampleType;
        entity.Method = dto.Method?.Trim();
        entity.TurnaroundHours = dto.TurnaroundHours;
        entity.IsActive = dto.IsActive;

        // Sync parameters
        entity.Parameters.Clear();
        int order = 0;
        foreach (var p in dto.Parameters)
        {
            entity.Parameters.Add(new LabExamParameter
            {
                LabExamId = entity.Id,
                LabParameterId = p.LabParameterId,
                SortOrder = p.SortOrder > 0 ? p.SortOrder : ++order,
                CustomReferenceMin = p.CustomReferenceMin,
                CustomReferenceMax = p.CustomReferenceMax,
                CustomReferenceText = p.CustomReferenceText?.Trim()
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.LabExams.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity == null)
        {
            return ApiResponse<bool>.Fail("Examen no encontrado.");
        }

        var isUsed = await _context.ClinicalStudyExams.AnyAsync(se => se.LabExamId == id, cancellationToken);
        if (isUsed)
        {
            entity.IsActive = false;
            await _context.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Examen desactivado (en uso por estudios/paquetes).");
        }

        _context.LabExams.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Examen eliminado exitosamente.");
    }
}
