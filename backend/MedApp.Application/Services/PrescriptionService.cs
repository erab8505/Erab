using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;

    public PrescriptionService(IApplicationDbContext context, ICompanyContext companyContext)
    {
        _context = context;
        _companyContext = companyContext;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<PrescriptionDto>> GetPrescriptionsByPatientAsync(Guid patientId)
    {
        return await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Employee)
            .Include(p => p.Items)
            .Where(p => p.PatientId == patientId)
            .OrderByDescending(p => p.PrescriptionDate)
            .Select(p => new PrescriptionDto(
                p.Id,
                p.CompanyId,
                p.PatientId,
                $"{p.Patient.FirstName} {p.Patient.LastName}",
                p.MedicalRecordId,
                p.EmployeeId,
                $"{p.Employee.FirstName} {p.Employee.LastName}",
                p.PrescriptionDate,
                p.Notes,
                p.Items.Select(i => new PrescriptionItemDto(
                    i.Id, i.PrescriptionId, i.MedicationName, i.Dosage, i.Frequency, i.DurationDays, i.Instructions
                )).ToList(),
                p.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<PrescriptionDto> GetPrescriptionByIdAsync(Guid id)
    {
        var p = await _context.Prescriptions
            .Include(pr => pr.Patient)
            .Include(pr => pr.Employee)
            .Include(pr => pr.Items)
            .FirstOrDefaultAsync(pr => pr.Id == id);

        if (p == null)
            throw new NotFoundException("Receta / Prescripción", id);

        return new PrescriptionDto(
            p.Id,
            p.CompanyId,
            p.PatientId,
            $"{p.Patient.FirstName} {p.Patient.LastName}",
            p.MedicalRecordId,
            p.EmployeeId,
            $"{p.Employee.FirstName} {p.Employee.LastName}",
            p.PrescriptionDate,
            p.Notes,
            p.Items.Select(i => new PrescriptionItemDto(
                i.Id, i.PrescriptionId, i.MedicationName, i.Dosage, i.Frequency, i.DurationDays, i.Instructions
            )).ToList(),
            p.CreatedAt
        );
    }

    public async Task<PrescriptionDto> CreatePrescriptionAsync(CreatePrescriptionDto dto)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);
        if (patient == null || patient.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El paciente ({dto.PatientId}) no existe en la empresa activa.");

        var employee = await _context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null || employee.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El profesional ({dto.EmployeeId}) no existe en la empresa activa.");

        if (dto.MedicalRecordId.HasValue)
        {
            var record = await _context.MedicalRecords.FindAsync(dto.MedicalRecordId.Value);
            if (record == null || record.CompanyId != CurrentCompanyId)
                throw new NotFoundException($"La nota médica ({dto.MedicalRecordId}) no pertenece a la empresa activa.");
        }

        var prescription = new Prescription
        {
            CompanyId = CurrentCompanyId,
            PatientId = dto.PatientId,
            EmployeeId = dto.EmployeeId,
            MedicalRecordId = dto.MedicalRecordId,
            PrescriptionDate = dto.PrescriptionDate ?? DateTimeOffset.UtcNow,
            Notes = dto.Notes
        };

        foreach (var itemDto in dto.Items)
        {
            prescription.Items.Add(new PrescriptionItem
            {
                MedicationName = itemDto.MedicationName,
                Dosage = itemDto.Dosage,
                Frequency = itemDto.Frequency,
                DurationDays = itemDto.DurationDays,
                Instructions = itemDto.Instructions
            });
        }

        await _context.Prescriptions.AddAsync(prescription);
        await _context.SaveChangesAsync();

        return new PrescriptionDto(
            prescription.Id,
            prescription.CompanyId,
            prescription.PatientId,
            $"{patient.FirstName} {patient.LastName}",
            prescription.MedicalRecordId,
            prescription.EmployeeId,
            $"{employee.FirstName} {employee.LastName}",
            prescription.PrescriptionDate,
            prescription.Notes,
            prescription.Items.Select(i => new PrescriptionItemDto(
                i.Id, i.PrescriptionId, i.MedicationName, i.Dosage, i.Frequency, i.DurationDays, i.Instructions
            )).ToList(),
            prescription.CreatedAt
        );
    }

    public async Task<bool> DeletePrescriptionAsync(Guid id)
    {
        var prescription = await _context.Prescriptions.FindAsync(id);
        if (prescription == null)
            throw new NotFoundException("Receta / Prescripción", id);

        _context.Prescriptions.Remove(prescription);
        await _context.SaveChangesAsync();
        return true;
    }
}
