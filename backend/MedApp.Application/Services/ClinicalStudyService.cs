using MedApp.Application.Common.Interfaces;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class ClinicalStudyService : IClinicalStudyService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;

    public ClinicalStudyService(IApplicationDbContext context, ICompanyContext companyContext)
    {
        _context = context;
        _companyContext = companyContext;
    }

    public async Task<ApiResponse<List<ClinicalStudyDto>>> GetAllAsync(StudyCategory? category = null, bool? isActive = null, CancellationToken cancellationToken = default)
    {
        var query = _context.ClinicalStudies
            .AsNoTracking()
            .Include(s => s.StudyExams)
                .ThenInclude(se => se.LabExam)
                    .ThenInclude(e => e.Parameters)
                        .ThenInclude(p => p.LabParameter)
            .AsQueryable();

        if (category.HasValue)
        {
            query = query.Where(s => s.Category == category.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        var list = await query
            .OrderBy(s => s.Name)
            .Select(s => new ClinicalStudyDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Description = s.Description,
                Category = s.Category,
                BasePrice = s.BasePrice,
                PreparationInstructions = s.PreparationInstructions,
                TurnaroundTimeHours = s.TurnaroundTimeHours,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt,
                Exams = s.StudyExams
                    .OrderBy(se => se.SortOrder)
                    .Select(se => new ClinicalStudyExamItemDto
                    {
                        Id = se.Id,
                        LabExamId = se.LabExamId,
                        ExamCode = se.LabExam.Code,
                        ExamName = se.LabExam.Name,
                        SampleType = se.LabExam.SampleType,
                        Method = se.LabExam.Method,
                        SortOrder = se.SortOrder,
                        Parameters = se.LabExam.Parameters
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
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<ClinicalStudyDto>>.Ok(list);
    }

    public async Task<ApiResponse<ClinicalStudyDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var s = await _context.ClinicalStudies
            .AsNoTracking()
            .Include(x => x.StudyExams)
                .ThenInclude(se => se.LabExam)
                    .ThenInclude(e => e.Parameters)
                        .ThenInclude(p => p.LabParameter)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (s == null)
        {
            return ApiResponse<ClinicalStudyDto>.Fail("Estudio no encontrado.");
        }

        return ApiResponse<ClinicalStudyDto>.Ok(new ClinicalStudyDto
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            Description = s.Description,
            Category = s.Category,
            BasePrice = s.BasePrice,
            PreparationInstructions = s.PreparationInstructions,
            TurnaroundTimeHours = s.TurnaroundTimeHours,
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt,
            Exams = s.StudyExams
                .OrderBy(se => se.SortOrder)
                .Select(se => new ClinicalStudyExamItemDto
                {
                    Id = se.Id,
                    LabExamId = se.LabExamId,
                    ExamCode = se.LabExam.Code,
                    ExamName = se.LabExam.Name,
                    SampleType = se.LabExam.SampleType,
                    Method = se.LabExam.Method,
                    SortOrder = se.SortOrder,
                    Parameters = se.LabExam.Parameters
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
                .ToList()
        });
    }

    public async Task<ApiResponse<ClinicalStudyDto>> CreateAsync(CreateClinicalStudyDto dto, CancellationToken cancellationToken = default)
    {
        if (_companyContext.CompanyId == null)
        {
            return ApiResponse<ClinicalStudyDto>.Fail("Contexto de empresa no establecido.");
        }

        var exists = await _context.ClinicalStudies
            .AnyAsync(s => s.CompanyId == _companyContext.CompanyId.Value && s.Code.ToLower() == dto.Code.Trim().ToLower(), cancellationToken);

        if (exists)
        {
            return ApiResponse<ClinicalStudyDto>.Fail($"Ya existe un estudio con el código '{dto.Code}'.");
        }

        var entity = new ClinicalStudy
        {
            CompanyId = _companyContext.CompanyId.Value,
            Code = dto.Code.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Category = dto.Category,
            BasePrice = dto.BasePrice,
            PreparationInstructions = dto.PreparationInstructions?.Trim(),
            TurnaroundTimeHours = dto.TurnaroundTimeHours,
            IsActive = true
        };

        int order = 0;
        foreach (var ex in dto.Exams)
        {
            entity.StudyExams.Add(new ClinicalStudyExam
            {
                LabExamId = ex.LabExamId,
                SortOrder = ex.SortOrder > 0 ? ex.SortOrder : ++order
            });
        }

        _context.ClinicalStudies.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<ApiResponse<ClinicalStudyDto>> UpdateAsync(Guid id, UpdateClinicalStudyDto dto, CancellationToken cancellationToken = default)
    {
        if (_companyContext.CompanyId == null)
        {
            return ApiResponse<ClinicalStudyDto>.Fail("Contexto de empresa no establecido.");
        }

        var entity = await _context.ClinicalStudies
            .Include(s => s.StudyExams)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity == null)
        {
            return ApiResponse<ClinicalStudyDto>.Fail("Estudio no encontrado.");
        }

        var exists = await _context.ClinicalStudies
            .AnyAsync(s => s.Id != id && s.CompanyId == _companyContext.CompanyId.Value && s.Code.ToLower() == dto.Code.Trim().ToLower(), cancellationToken);

        if (exists)
        {
            return ApiResponse<ClinicalStudyDto>.Fail($"Ya existe otro estudio con el código '{dto.Code}'.");
        }

        entity.Code = dto.Code.Trim().ToUpper();
        entity.Name = dto.Name.Trim();
        entity.Description = dto.Description?.Trim();
        entity.Category = dto.Category;
        entity.BasePrice = dto.BasePrice;
        entity.PreparationInstructions = dto.PreparationInstructions?.Trim();
        entity.TurnaroundTimeHours = dto.TurnaroundTimeHours;
        entity.IsActive = dto.IsActive;

        // Sync exams
        entity.StudyExams.Clear();
        int order = 0;
        foreach (var ex in dto.Exams)
        {
            entity.StudyExams.Add(new ClinicalStudyExam
            {
                ClinicalStudyId = entity.Id,
                LabExamId = ex.LabExamId,
                SortOrder = ex.SortOrder > 0 ? ex.SortOrder : ++order
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.ClinicalStudies.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity == null)
        {
            return ApiResponse<bool>.Fail("Estudio no encontrado.");
        }

        var hasOrders = await _context.StudyOrderItems.AnyAsync(i => i.ClinicalStudyId == id, cancellationToken);
        if (hasOrders)
        {
            entity.IsActive = false;
            await _context.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Estudio desactivado porque tiene órdenes asociadas.");
        }

        _context.ClinicalStudies.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Estudio eliminado exitosamente.");
    }
}
