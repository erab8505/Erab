using MedApp.Application.Common.Interfaces;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class LabParameterService : ILabParameterService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;

    public LabParameterService(IApplicationDbContext context, ICompanyContext companyContext)
    {
        _context = context;
        _companyContext = companyContext;
    }

    public async Task<ApiResponse<List<LabParameterDto>>> GetAllAsync(string? search = null, bool? isActive = null, CancellationToken cancellationToken = default)
    {
        var query = _context.LabParameters.AsNoTracking().AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(p => p.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.Code.ToLower().Contains(s) || (p.Unit != null && p.Unit.ToLower().Contains(s)));
        }

        var list = await query
            .OrderBy(p => p.Name)
            .Select(p => new LabParameterDto
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                Unit = p.Unit,
                ValueType = p.ValueType,
                DefaultReferenceMin = p.DefaultReferenceMin,
                DefaultReferenceMax = p.DefaultReferenceMax,
                DefaultReferenceText = p.DefaultReferenceText,
                DefaultReagentName = p.DefaultReagentName,
                DefaultReagentQuantity = p.DefaultReagentQuantity,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<LabParameterDto>>.Ok(list);
    }

    public async Task<ApiResponse<LabParameterDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var p = await _context.LabParameters.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (p == null)
        {
            return ApiResponse<LabParameterDto>.Fail("Parámetro no encontrado.");
        }

        return ApiResponse<LabParameterDto>.Ok(new LabParameterDto
        {
            Id = p.Id,
            Code = p.Code,
            Name = p.Name,
            Description = p.Description,
            Unit = p.Unit,
            ValueType = p.ValueType,
            DefaultReferenceMin = p.DefaultReferenceMin,
            DefaultReferenceMax = p.DefaultReferenceMax,
            DefaultReferenceText = p.DefaultReferenceText,
            DefaultReagentName = p.DefaultReagentName,
            DefaultReagentQuantity = p.DefaultReagentQuantity,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt
        });
    }

    public async Task<ApiResponse<LabParameterDto>> CreateAsync(CreateLabParameterDto dto, CancellationToken cancellationToken = default)
    {
        if (_companyContext.CompanyId == null)
        {
            return ApiResponse<LabParameterDto>.Fail("Contexto de empresa no establecido.");
        }

        var exists = await _context.LabParameters
            .AnyAsync(p => p.CompanyId == _companyContext.CompanyId.Value && p.Code.ToLower() == dto.Code.Trim().ToLower(), cancellationToken);

        if (exists)
        {
            return ApiResponse<LabParameterDto>.Fail($"Ya existe un parámetro con el código '{dto.Code}'.");
        }

        var entity = new LabParameter
        {
            CompanyId = _companyContext.CompanyId.Value,
            Code = dto.Code.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Unit = dto.Unit?.Trim(),
            ValueType = dto.ValueType,
            DefaultReferenceMin = dto.DefaultReferenceMin,
            DefaultReferenceMax = dto.DefaultReferenceMax,
            DefaultReferenceText = dto.DefaultReferenceText?.Trim(),
            DefaultReagentName = dto.DefaultReagentName?.Trim(),
            DefaultReagentQuantity = dto.DefaultReagentQuantity,
            IsActive = true
        };

        _context.LabParameters.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<ApiResponse<LabParameterDto>> UpdateAsync(Guid id, UpdateLabParameterDto dto, CancellationToken cancellationToken = default)
    {
        if (_companyContext.CompanyId == null)
        {
            return ApiResponse<LabParameterDto>.Fail("Contexto de empresa no establecido.");
        }

        var entity = await _context.LabParameters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity == null)
        {
            return ApiResponse<LabParameterDto>.Fail("Parámetro no encontrado.");
        }

        var exists = await _context.LabParameters
            .AnyAsync(p => p.Id != id && p.CompanyId == _companyContext.CompanyId.Value && p.Code.ToLower() == dto.Code.Trim().ToLower(), cancellationToken);

        if (exists)
        {
            return ApiResponse<LabParameterDto>.Fail($"Ya existe otro parámetro con el código '{dto.Code}'.");
        }

        entity.Code = dto.Code.Trim().ToUpper();
        entity.Name = dto.Name.Trim();
        entity.Description = dto.Description?.Trim();
        entity.Unit = dto.Unit?.Trim();
        entity.ValueType = dto.ValueType;
        entity.DefaultReferenceMin = dto.DefaultReferenceMin;
        entity.DefaultReferenceMax = dto.DefaultReferenceMax;
        entity.DefaultReferenceText = dto.DefaultReferenceText?.Trim();
        entity.DefaultReagentName = dto.DefaultReagentName?.Trim();
        entity.DefaultReagentQuantity = dto.DefaultReagentQuantity;
        entity.IsActive = dto.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.LabParameters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity == null)
        {
            return ApiResponse<bool>.Fail("Parámetro no encontrado.");
        }

        // Check if referenced in any exam
        var isUsed = await _context.LabExamParameters.AnyAsync(ep => ep.LabParameterId == id, cancellationToken);
        if (isUsed)
        {
            // Soft delete by deactivating
            entity.IsActive = false;
            await _context.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Parámetro desactivado (en uso por exámenes).");
        }

        _context.LabParameters.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Parámetro eliminado exitosamente.");
    }
}
