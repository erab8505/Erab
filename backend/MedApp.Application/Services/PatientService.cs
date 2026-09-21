using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class PatientService : IPatientService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;

    public PatientService(IApplicationDbContext context, ICompanyContext companyContext)
    {
        _context = context;
        _companyContext = companyContext;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public static int CalculateAge(DateOnly birthDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - birthDate.Year;
        if (birthDate > today.AddYears(-age))
            age--;
        return Math.Max(0, age);
    }

    public async Task<List<PatientDto>> SearchPatientsAsync(string? query = null)
    {
        var dbQuery = _context.Patients.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLower();
            dbQuery = dbQuery.Where(p =>
                p.FirstName.ToLower().Contains(q) ||
                p.LastName.ToLower().Contains(q) ||
                (p.FirstName + " " + p.LastName).ToLower().Contains(q) ||
                (p.LastName + " " + p.FirstName).ToLower().Contains(q) ||
                p.DocumentId.ToLower().Contains(q) ||
                (p.Phone != null && p.Phone.ToLower().Contains(q)));
        }

        var patients = await dbQuery
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .ToListAsync();

        return patients.Select(p => new PatientDto(
            p.Id,
            p.CompanyId,
            p.FirstName,
            p.LastName,
            p.BirthDate,
            CalculateAge(p.BirthDate),
            p.Gender,
            p.DocumentId,
            p.Email,
            p.Phone,
            p.BloodType,
            p.Allergies,
            p.CreatedAt
        )).ToList();
    }

    public async Task<PatientDto> GetPatientByIdAsync(Guid id)
    {
        var p = await _context.Patients.FindAsync(id);
        if (p == null)
            throw new NotFoundException("Paciente", id);

        return new PatientDto(
            p.Id,
            p.CompanyId,
            p.FirstName,
            p.LastName,
            p.BirthDate,
            CalculateAge(p.BirthDate),
            p.Gender,
            p.DocumentId,
            p.Email,
            p.Phone,
            p.BloodType,
            p.Allergies,
            p.CreatedAt
        );
    }

    public async Task<PatientDto> CreatePatientAsync(CreatePatientDto dto)
    {
        var existsDoc = await _context.Patients
            .AnyAsync(p => p.CompanyId == CurrentCompanyId && p.DocumentId == dto.DocumentId);

        if (existsDoc)
            throw new ConflictException($"Ya existe un paciente con el documento '{dto.DocumentId}' en esta empresa.");

        var patient = new Patient
        {
            CompanyId = CurrentCompanyId,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            BirthDate = dto.BirthDate,
            Gender = dto.Gender,
            DocumentId = dto.DocumentId,
            Email = dto.Email,
            Phone = dto.Phone,
            BloodType = dto.BloodType,
            Allergies = dto.Allergies
        };

        await _context.Patients.AddAsync(patient);
        await _context.SaveChangesAsync();

        return new PatientDto(
            patient.Id,
            patient.CompanyId,
            patient.FirstName,
            patient.LastName,
            patient.BirthDate,
            CalculateAge(patient.BirthDate),
            patient.Gender,
            patient.DocumentId,
            patient.Email,
            patient.Phone,
            patient.BloodType,
            patient.Allergies,
            patient.CreatedAt
        );
    }

    public async Task<PatientDto> UpdatePatientAsync(Guid id, UpdatePatientDto dto)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null)
            throw new NotFoundException("Paciente", id);

        if (patient.DocumentId != dto.DocumentId)
        {
            var existsDoc = await _context.Patients
                .AnyAsync(p => p.CompanyId == CurrentCompanyId && p.DocumentId == dto.DocumentId && p.Id != id);

            if (existsDoc)
                throw new ConflictException($"Ya existe otro paciente con el documento '{dto.DocumentId}' en esta empresa.");
        }

        patient.FirstName = dto.FirstName;
        patient.LastName = dto.LastName;
        patient.BirthDate = dto.BirthDate;
        patient.Gender = dto.Gender;
        patient.DocumentId = dto.DocumentId;
        patient.Email = dto.Email;
        patient.Phone = dto.Phone;
        patient.BloodType = dto.BloodType;
        patient.Allergies = dto.Allergies;

        await _context.SaveChangesAsync();

        return new PatientDto(
            patient.Id,
            patient.CompanyId,
            patient.FirstName,
            patient.LastName,
            patient.BirthDate,
            CalculateAge(patient.BirthDate),
            patient.Gender,
            patient.DocumentId,
            patient.Email,
            patient.Phone,
            patient.BloodType,
            patient.Allergies,
            patient.CreatedAt
        );
    }

    public async Task<bool> DeletePatientAsync(Guid id)
    {
        var patient = await _context.Patients
            .Include(p => p.Schedulings)
            .Include(p => p.MedicalRecords)
            .Include(p => p.Prescriptions)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (patient == null)
            throw new NotFoundException("Paciente", id);

        if (patient.Schedulings.Any() || patient.MedicalRecords.Any() || patient.Prescriptions.Any())
        {
            throw new ConflictException("No se puede eliminar el paciente porque registra historial clínico, citas o recetas asociadas.");
        }

        _context.Patients.Remove(patient);
        await _context.SaveChangesAsync();
        return true;
    }
}
