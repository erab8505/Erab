using MedApp.Application.Common.Interfaces;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Constants;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class StudyOrderService : IStudyOrderService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public StudyOrderService(
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

    public async Task<ApiResponse<List<StudyOrderDto>>> GetAllAsync(Guid? patientId = null, StudyOrderStatus? status = null, CancellationToken cancellationToken = default)
    {
        var query = _context.StudyOrders
            .AsNoTracking()
            .Include(o => o.Patient)
            .Include(o => o.RequestingDoctor)
            .Include(o => o.Laboratorist)
            .Include(o => o.Items)
                .ThenInclude(i => i.ClinicalStudy)
            .Include(o => o.Items)
                .ThenInclude(i => i.Results)
                    .ThenInclude(r => r.LabExam)
            .AsQueryable();

        if (patientId.HasValue)
        {
            query = query.Where(o => o.PatientId == patientId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(o => o.Status == status.Value);
        }

        var list = await query
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new StudyOrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                PatientId = o.PatientId,
                PatientName = o.Patient.FirstName + " " + o.Patient.LastName,
                PatientDocumentId = o.Patient.DocumentId,
                PatientPhone = o.Patient.Phone,
                RequestingDoctorId = o.RequestingDoctorId,
                RequestingDoctorName = o.RequestingDoctor != null ? o.RequestingDoctor.FirstName + " " + o.RequestingDoctor.LastName : null,
                LaboratoristId = o.LaboratoristId,
                LaboratoristName = o.Laboratorist != null ? o.Laboratorist.FirstName + " " + o.Laboratorist.LastName : o.LaboratoristName,
                SchedulingId = o.SchedulingId,
                Status = o.Status,
                OrderDate = o.OrderDate,
                CompletedDate = o.CompletedDate,
                ClinicalDiagnosis = o.ClinicalDiagnosis,
                Notes = o.Notes,
                TotalAmount = o.TotalAmount,
                Items = o.Items.Select(i => new StudyOrderItemDto
                {
                    Id = i.Id,
                    ClinicalStudyId = i.ClinicalStudyId,
                    StudyCode = i.ClinicalStudy.Code,
                    StudyName = i.ClinicalStudy.Name,
                    StudyCategory = i.ClinicalStudy.Category,
                    Price = i.Price,
                    Status = i.Status,
                    Observations = i.Observations,
                    Results = i.Results.Select(r => new StudyOrderResultDto
                    {
                        Id = r.Id,
                        StudyOrderItemId = r.StudyOrderItemId,
                        LabExamId = r.LabExamId,
                        ExamName = r.LabExam.Name,
                        LabParameterId = r.LabParameterId,
                        ParameterCode = r.ParameterCode,
                        ParameterName = r.ParameterName,
                        Unit = r.Unit,
                        ValueType = r.ValueType,
                        NumericValue = r.NumericValue,
                        TextValue = r.TextValue,
                        ReferenceRangeMin = r.ReferenceRangeMin,
                        ReferenceRangeMax = r.ReferenceRangeMax,
                        ReferenceText = r.ReferenceText,
                        IsOutOfRange = r.IsOutOfRange,
                        AlertLevel = r.AlertLevel,
                        Interpretation = r.Interpretation,
                        TechnicianNotes = r.TechnicianNotes
                    }).ToList()
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<StudyOrderDto>>.Ok(list);
    }

    public async Task<ApiResponse<StudyOrderDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var o = await _context.StudyOrders
            .AsNoTracking()
            .Include(x => x.Patient)
            .Include(x => x.RequestingDoctor)
            .Include(x => x.Laboratorist)
            .Include(x => x.Items)
                .ThenInclude(i => i.ClinicalStudy)
            .Include(x => x.Items)
                .ThenInclude(i => i.Results)
                    .ThenInclude(r => r.LabExam)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (o == null)
        {
            return ApiResponse<StudyOrderDto>.Fail("Orden de estudio no encontrada.");
        }

        return ApiResponse<StudyOrderDto>.Ok(new StudyOrderDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            PatientId = o.PatientId,
            PatientName = o.Patient.FirstName + " " + o.Patient.LastName,
            PatientDocumentId = o.Patient.DocumentId,
            PatientPhone = o.Patient.Phone,
            RequestingDoctorId = o.RequestingDoctorId,
            RequestingDoctorName = o.RequestingDoctor != null ? o.RequestingDoctor.FirstName + " " + o.RequestingDoctor.LastName : null,
            LaboratoristId = o.LaboratoristId,
            LaboratoristName = o.Laboratorist != null ? o.Laboratorist.FirstName + " " + o.Laboratorist.LastName : o.LaboratoristName,
            SchedulingId = o.SchedulingId,
            Status = o.Status,
            OrderDate = o.OrderDate,
            CompletedDate = o.CompletedDate,
            ClinicalDiagnosis = o.ClinicalDiagnosis,
            Notes = o.Notes,
            TotalAmount = o.TotalAmount,
            Items = o.Items.Select(i => new StudyOrderItemDto
            {
                Id = i.Id,
                ClinicalStudyId = i.ClinicalStudyId,
                StudyCode = i.ClinicalStudy.Code,
                StudyName = i.ClinicalStudy.Name,
                StudyCategory = i.ClinicalStudy.Category,
                Price = i.Price,
                Status = i.Status,
                Observations = i.Observations,
                Results = i.Results.Select(r => new StudyOrderResultDto
                {
                    Id = r.Id,
                    StudyOrderItemId = r.StudyOrderItemId,
                    LabExamId = r.LabExamId,
                    ExamName = r.LabExam.Name,
                    LabParameterId = r.LabParameterId,
                    ParameterCode = r.ParameterCode,
                    ParameterName = r.ParameterName,
                    Unit = r.Unit,
                    ValueType = r.ValueType,
                    NumericValue = r.NumericValue,
                    TextValue = r.TextValue,
                    ReferenceRangeMin = r.ReferenceRangeMin,
                    ReferenceRangeMax = r.ReferenceRangeMax,
                    ReferenceText = r.ReferenceText,
                    IsOutOfRange = r.IsOutOfRange,
                    AlertLevel = r.AlertLevel,
                    Interpretation = r.Interpretation,
                    TechnicianNotes = r.TechnicianNotes
                }).ToList()
            }).ToList()
        });
    }

    public async Task<ApiResponse<StudyOrderDto>> CreateAsync(CreateStudyOrderDto dto, CancellationToken cancellationToken = default)
    {
        if (_companyContext.CompanyId == null)
        {
            return ApiResponse<StudyOrderDto>.Fail("Contexto de empresa no establecido.");
        }

        var companyFeatures = await _context.CompanyFeatures
            .IgnoreQueryFilters()
            .Where(f => f.CompanyId == _companyContext.CompanyId.Value)
            .ToListAsync(cancellationToken);

        var labFeature = companyFeatures.FirstOrDefault(f => string.Equals(f.FeatureKey, CompanyFeatureKeys.ModuleLaboratory, StringComparison.OrdinalIgnoreCase));
        if (labFeature != null && !labFeature.IsEnabled)
        {
            return ApiResponse<StudyOrderDto>.Fail("El módulo de laboratorio no está habilitado para esta empresa.");
        }

        if (_currentUserService.IsReceptionist && !_currentUserService.IsAdmin && !_currentUserService.IsSuperAdmin)
        {
            var allowReceptionist = companyFeatures.FirstOrDefault(f => string.Equals(f.FeatureKey, CompanyFeatureKeys.AllowReceptionistStudyOrders, StringComparison.OrdinalIgnoreCase));
            if (allowReceptionist != null && !allowReceptionist.IsEnabled)
            {
                return ApiResponse<StudyOrderDto>.Fail("El rol de recepcionista no tiene permiso para crear órdenes de estudio en esta empresa.");
            }
        }

        if (dto.ClinicalStudyIds == null || dto.ClinicalStudyIds.Count == 0)
        {
            return ApiResponse<StudyOrderDto>.Fail("Debe seleccionar al menos un estudio.");
        }

        var studies = await _context.ClinicalStudies
            .Include(s => s.StudyExams)
                .ThenInclude(se => se.LabExam)
                    .ThenInclude(e => e.Parameters)
                        .ThenInclude(p => p.LabParameter)
            .Where(s => dto.ClinicalStudyIds.Contains(s.Id))
            .ToListAsync(cancellationToken);

        if (studies.Count == 0)
        {
            return ApiResponse<StudyOrderDto>.Fail("No se encontraron los estudios seleccionados.");
        }

        // Generate auto order number
        var year = DateTimeOffset.UtcNow.Year;
        var count = await _context.StudyOrders.CountAsync(o => o.OrderDate.Year == year, cancellationToken);
        var orderNumber = $"LAB-{year}-{(count + 1):D5}";

        var order = new StudyOrder
        {
            CompanyId = _companyContext.CompanyId.Value,
            PatientId = dto.PatientId,
            RequestingDoctorId = dto.RequestingDoctorId,
            SchedulingId = dto.SchedulingId,
            OrderNumber = orderNumber,
            Status = StudyOrderStatus.Requested,
            OrderDate = DateTimeOffset.UtcNow,
            ClinicalDiagnosis = dto.ClinicalDiagnosis?.Trim(),
            Notes = dto.Notes?.Trim(),
            TotalAmount = studies.Sum(s => s.BasePrice)
        };

        foreach (var study in studies)
        {
            var item = new StudyOrderItem
            {
                ClinicalStudyId = study.Id,
                Price = study.BasePrice,
                Status = StudyOrderStatus.Requested
            };

            foreach (var se in study.StudyExams.OrderBy(x => x.SortOrder))
            {
                foreach (var ep in se.LabExam.Parameters.OrderBy(x => x.SortOrder))
                {
                    item.Results.Add(new StudyOrderResult
                    {
                        LabExamId = se.LabExamId,
                        LabParameterId = ep.LabParameterId,
                        ParameterCode = ep.LabParameter.Code,
                        ParameterName = ep.LabParameter.Name,
                        Unit = ep.LabParameter.Unit,
                        ValueType = ep.LabParameter.ValueType,
                        ReferenceRangeMin = ep.CustomReferenceMin ?? ep.LabParameter.DefaultReferenceMin,
                        ReferenceRangeMax = ep.CustomReferenceMax ?? ep.LabParameter.DefaultReferenceMax,
                        ReferenceText = ep.CustomReferenceText ?? ep.LabParameter.DefaultReferenceText,
                        IsOutOfRange = false,
                        AlertLevel = "Normal"
                    });
                }
            }

            order.Items.Add(item);
        }

        _context.StudyOrders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            "CREATE",
            "Laboratory",
            order.Id.ToString(),
            $"Generó la orden de estudio clínico #{order.OrderNumber} ({string.Join(", ", studies.Select(s => s.Name))})"
        );

        return await GetByIdAsync(order.Id, cancellationToken);
    }

    public async Task<ApiResponse<StudyOrderDto>> UpdateStatusAsync(Guid id, StudyOrderStatus status, CancellationToken cancellationToken = default)
    {
        var order = await _context.StudyOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (order == null)
        {
            return ApiResponse<StudyOrderDto>.Fail("Orden no encontrada.");
        }

        var oldStatus = order.Status;
        order.Status = status;
        foreach (var item in order.Items)
        {
            item.Status = status;
        }

        if (status == StudyOrderStatus.Completed || status == StudyOrderStatus.Delivered)
        {
            order.CompletedDate = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            "STATUS_CHANGE",
            "Laboratory",
            order.Id.ToString(),
            $"Cambió el estado de la orden #{order.OrderNumber} de '{oldStatus}' a '{status}'"
        );

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<ApiResponse<StudyOrderDto>> SaveResultsAsync(Guid id, SaveStudyResultsDto dto, CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.IsLaboratorist && !_currentUserService.IsAdmin)
        {
            return ApiResponse<StudyOrderDto>.Fail("Solo el personal con rol de Laboratorista tiene permisos para registrar y validar resultados de análisis clínicos.");
        }

        string? resolvedLaboratoristName = dto.LaboratoristName?.Trim();
        Guid? resolvedLaboratoristId = dto.LaboratoristId;

        if (string.IsNullOrWhiteSpace(resolvedLaboratoristName) && _currentUserService.UserId.HasValue)
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.Id == _currentUserService.UserId.Value, cancellationToken);

            if (user != null)
            {
                if (user.Employee != null)
                {
                    resolvedLaboratoristName = user.Employee.FullName;
                    resolvedLaboratoristId = user.EmployeeId;
                }
                else
                {
                    resolvedLaboratoristName = user.Username;
                }
            }
        }

        if (string.IsNullOrWhiteSpace(resolvedLaboratoristName))
        {
            resolvedLaboratoristName = "Responsable de Laboratorio Clínico";
        }

        var order = await _context.StudyOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Results)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (order == null)
        {
            return ApiResponse<StudyOrderDto>.Fail("Orden no encontrada.");
        }

        order.LaboratoristId = resolvedLaboratoristId;
        order.LaboratoristName = resolvedLaboratoristName;

        if (!order.RequestingDoctorId.HasValue && dto.RequestingDoctorId.HasValue)
        {
            order.RequestingDoctorId = dto.RequestingDoctorId.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.GeneralInterpretation))
        {
            order.Notes = dto.GeneralInterpretation.Trim();
        }

        foreach (var incoming in dto.Results)
        {
            var item = order.Items.FirstOrDefault(i => i.Id == incoming.StudyOrderItemId);
            if (item == null) continue;

            var res = item.Results.FirstOrDefault(r => r.LabParameterId == incoming.LabParameterId);
            if (res == null) continue;

            res.NumericValue = incoming.NumericValue;
            res.TextValue = incoming.TextValue?.Trim();
            res.Interpretation = incoming.Interpretation?.Trim();
            res.TechnicianNotes = incoming.TechnicianNotes?.Trim();

            // Evaluate out-of-range
            if (res.ValueType == ParameterValueType.Numeric && res.NumericValue.HasValue)
            {
                var val = res.NumericValue.Value;
                if (res.ReferenceRangeMax.HasValue && val > res.ReferenceRangeMax.Value)
                {
                    res.IsOutOfRange = true;
                    res.AlertLevel = "High";
                }
                else if (res.ReferenceRangeMin.HasValue && val < res.ReferenceRangeMin.Value)
                {
                    res.IsOutOfRange = true;
                    res.AlertLevel = "Low";
                }
                else
                {
                    res.IsOutOfRange = false;
                    res.AlertLevel = "Normal";
                }
            }
            else
            {
                res.IsOutOfRange = false;
                res.AlertLevel = "Normal";
            }
        }

        order.Status = StudyOrderStatus.Completed;
        order.CompletedDate = DateTimeOffset.UtcNow;
        foreach (var item in order.Items)
        {
            item.Status = StudyOrderStatus.Completed;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            "SAVE_RESULTS",
            "Laboratory",
            order.Id.ToString(),
            $"Registró y validó resultados analíticos para la orden #{order.OrderNumber} (Responsable: {resolvedLaboratoristName})"
        );

        return await GetByIdAsync(id, cancellationToken);
    }
}
