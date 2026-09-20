using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class MedicalRecordService : IMedicalRecordService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;

    public MedicalRecordService(IApplicationDbContext context, ICompanyContext companyContext)
    {
        _context = context;
        _companyContext = companyContext;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<MedicalRecordDto>> GetMedicalRecordsByPatientAsync(Guid patientId)
    {
        return await _context.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.InterventionType)
            .Where(m => m.PatientId == patientId)
            .OrderByDescending(m => m.RecordDate)
            .Select(m => new MedicalRecordDto(
                m.Id,
                m.CompanyId,
                m.PatientId,
                $"{m.Patient.FirstName} {m.Patient.LastName}",
                m.InterventionTypeId,
                m.InterventionType != null ? m.InterventionType.Name : null,
                m.RecordDate,
                m.Diagnosis,
                m.Treatment,
                m.Notes,
                m.WeightKg,
                m.HeightCm,
                m.TemperatureCelsius,
                m.SystolicBP,
                m.DiastolicBP,
                m.HeartRateBpm,
                m.OxygenSaturation,
                m.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<MedicalRecordDto> GetMedicalRecordByIdAsync(Guid id)
    {
        var m = await _context.MedicalRecords
            .Include(mr => mr.Patient)
            .Include(mr => mr.InterventionType)
            .FirstOrDefaultAsync(mr => mr.Id == id);

        if (m == null)
            throw new NotFoundException("Historia / Nota médica", id);

        return new MedicalRecordDto(
            m.Id,
            m.CompanyId,
            m.PatientId,
            $"{m.Patient.FirstName} {m.Patient.LastName}",
            m.InterventionTypeId,
            m.InterventionType != null ? m.InterventionType.Name : null,
            m.RecordDate,
            m.Diagnosis,
            m.Treatment,
            m.Notes,
            m.WeightKg,
            m.HeightCm,
            m.TemperatureCelsius,
            m.SystolicBP,
            m.DiastolicBP,
            m.HeartRateBpm,
            m.OxygenSaturation,
            m.CreatedAt
        );
    }

    public async Task<MedicalRecordDto> CreateMedicalRecordAsync(CreateMedicalRecordDto dto)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);
        if (patient == null || patient.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El paciente ({dto.PatientId}) no existe en la empresa activa.");

        string? procedureName = null;
        if (dto.InterventionTypeId.HasValue)
        {
            var intervention = await _context.InterventionTypes.FindAsync(dto.InterventionTypeId.Value);
            if (intervention == null || intervention.CompanyId != CurrentCompanyId)
                throw new NotFoundException($"El procedimiento ({dto.InterventionTypeId}) no pertenece a la empresa activa.");
            procedureName = intervention.Name;
        }

        var record = new MedicalRecord
        {
            CompanyId = CurrentCompanyId,
            PatientId = dto.PatientId,
            InterventionTypeId = dto.InterventionTypeId,
            RecordDate = dto.RecordDate ?? DateTimeOffset.UtcNow,
            Diagnosis = dto.Diagnosis,
            Treatment = dto.Treatment,
            Notes = dto.Notes,
            WeightKg = dto.WeightKg,
            HeightCm = dto.HeightCm,
            TemperatureCelsius = dto.TemperatureCelsius,
            SystolicBP = dto.SystolicBP,
            DiastolicBP = dto.DiastolicBP,
            HeartRateBpm = dto.HeartRateBpm,
            OxygenSaturation = dto.OxygenSaturation
        };

        await _context.MedicalRecords.AddAsync(record);
        await _context.SaveChangesAsync();

        return new MedicalRecordDto(
            record.Id,
            record.CompanyId,
            record.PatientId,
            $"{patient.FirstName} {patient.LastName}",
            record.InterventionTypeId,
            procedureName,
            record.RecordDate,
            record.Diagnosis,
            record.Treatment,
            record.Notes,
            record.WeightKg,
            record.HeightCm,
            record.TemperatureCelsius,
            record.SystolicBP,
            record.DiastolicBP,
            record.HeartRateBpm,
            record.OxygenSaturation,
            record.CreatedAt
        );
    }

    public async Task<MedicalRecordDto> UpdateMedicalRecordAsync(Guid id, UpdateMedicalRecordDto dto)
    {
        var record = await _context.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.InterventionType)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (record == null)
            throw new NotFoundException("Historia / Nota médica", id);

        string? procedureName = null;
        if (dto.InterventionTypeId.HasValue)
        {
            var intervention = await _context.InterventionTypes.FindAsync(dto.InterventionTypeId.Value);
            if (intervention == null || intervention.CompanyId != CurrentCompanyId)
                throw new NotFoundException($"El procedimiento ({dto.InterventionTypeId}) no pertenece a la empresa activa.");
            procedureName = intervention.Name;
        }

        record.InterventionTypeId = dto.InterventionTypeId;
        record.Diagnosis = dto.Diagnosis;
        record.Treatment = dto.Treatment;
        record.Notes = dto.Notes;
        record.WeightKg = dto.WeightKg;
        record.HeightCm = dto.HeightCm;
        record.TemperatureCelsius = dto.TemperatureCelsius;
        record.SystolicBP = dto.SystolicBP;
        record.DiastolicBP = dto.DiastolicBP;
        record.HeartRateBpm = dto.HeartRateBpm;
        record.OxygenSaturation = dto.OxygenSaturation;

        await _context.SaveChangesAsync();

        return new MedicalRecordDto(
            record.Id,
            record.CompanyId,
            record.PatientId,
            $"{record.Patient.FirstName} {record.Patient.LastName}",
            record.InterventionTypeId,
            procedureName,
            record.RecordDate,
            record.Diagnosis,
            record.Treatment,
            record.Notes,
            record.WeightKg,
            record.HeightCm,
            record.TemperatureCelsius,
            record.SystolicBP,
            record.DiastolicBP,
            record.HeartRateBpm,
            record.OxygenSaturation,
            record.CreatedAt
        );
    }

    public async Task<bool> DeleteMedicalRecordAsync(Guid id)
    {
        var record = await _context.MedicalRecords
            .Include(m => m.Prescriptions)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (record == null)
            throw new NotFoundException("Historia / Nota médica", id);

        if (record.Prescriptions.Any())
        {
            throw new ConflictException("No se puede eliminar la nota médica porque tiene prescripciones asociadas.");
        }

        _context.MedicalRecords.Remove(record);
        await _context.SaveChangesAsync();
        return true;
    }
}
