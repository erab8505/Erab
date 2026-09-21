using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class SchedulingService : ISchedulingService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;
    private readonly ICurrentUserService _currentUserService;

    public SchedulingService(
        IApplicationDbContext context,
        ICompanyContext companyContext,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _companyContext = companyContext;
        _currentUserService = currentUserService;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<SchedulingDto>> GetSchedulingsAsync(
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        Guid? specialistId = null,
        Guid? patientId = null,
        AppointmentStatus? status = null)
    {
        var query = _context.Schedulings
            .Include(s => s.Patient)
            .Include(s => s.Specialist)
            .Include(s => s.InterventionType)
            .AsQueryable();

        if (fromDate.HasValue)
        {
            query = query.Where(s => s.ScheduledAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(s => s.ScheduledAt <= toDate.Value);
        }

        // If the logged-in user is a specialist, strictly force their own SpecialistId
        if (_currentUserService.IsSpecialist)
        {
            if (!_currentUserService.SpecialistId.HasValue)
            {
                return new List<SchedulingDto>();
            }
            query = query.Where(s => s.SpecialistId == _currentUserService.SpecialistId.Value);
        }
        else if (specialistId.HasValue)
        {
            query = query.Where(s => s.SpecialistId == specialistId.Value);
        }

        if (patientId.HasValue)
        {
            query = query.Where(s => s.PatientId == patientId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        var schedulings = await query
            .OrderBy(s => s.ScheduledAt)
            .ToListAsync();

        var schedulingIds = schedulings.Select(s => s.Id).ToList();
        var payments = await _context.Payments
            .Where(p => p.SchedulingId.HasValue && schedulingIds.Contains(p.SchedulingId.Value))
            .ToDictionaryAsync(p => p.SchedulingId!.Value);

        return schedulings.Select(s =>
        {
            payments.TryGetValue(s.Id, out var payment);
            return new SchedulingDto(
                s.Id,
                s.CompanyId,
                s.PatientId,
                $"{s.Patient.FirstName} {s.Patient.LastName}",
                s.Patient.DocumentId,
                s.SpecialistId,
                $"{s.Specialist.FirstName} {s.Specialist.LastName}",
                s.InterventionTypeId,
                s.InterventionType.Name,
                s.ScheduledAt,
                s.DurationMinutes,
                s.Notes,
                s.Status,
                s.CreatedAt,
                PaymentStatus: payment?.Status,
                PaymentAmount: payment?.Amount,
                PaymentMethod: payment?.Method,
                PaymentId: payment?.Id
            );
        }).ToList();
    }

    public async Task<SchedulingDto> GetSchedulingByIdAsync(Guid id)
    {
        var s = await _context.Schedulings
            .Include(sc => sc.Patient)
            .Include(sc => sc.Specialist)
            .Include(sc => sc.InterventionType)
            .FirstOrDefaultAsync(sc => sc.Id == id);

        if (s == null)
            throw new NotFoundException("Cita médica", id);

        if (_currentUserService.IsSpecialist && s.SpecialistId != _currentUserService.SpecialistId)
            throw new NotFoundException("Cita médica", id);

        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.SchedulingId == id);

        return new SchedulingDto(
            s.Id,
            s.CompanyId,
            s.PatientId,
            $"{s.Patient.FirstName} {s.Patient.LastName}",
            s.Patient.DocumentId,
            s.SpecialistId,
            $"{s.Specialist.FirstName} {s.Specialist.LastName}",
            s.InterventionTypeId,
            s.InterventionType.Name,
            s.ScheduledAt,
            s.DurationMinutes,
            s.Notes,
            s.Status,
            s.CreatedAt,
            PaymentStatus: payment?.Status,
            PaymentAmount: payment?.Amount,
            PaymentMethod: payment?.Method,
            PaymentId: payment?.Id
        );
    }

    public async Task<SchedulingDto> CreateSchedulingAsync(CreateSchedulingDto dto)
    {
        if (_currentUserService.IsSpecialist)
        {
            if (!_currentUserService.SpecialistId.HasValue || dto.SpecialistId != _currentUserService.SpecialistId.Value)
            {
                throw new ForbiddenAccessException("Un especialista solo puede agendar citas para su propio perfil profesional.");
            }
        }

        var patient = await _context.Patients.FindAsync(dto.PatientId);
        if (patient == null || patient.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El paciente ({dto.PatientId}) no existe en la empresa activa.");

        var specialist = await _context.Specialists.FindAsync(dto.SpecialistId);
        if (specialist == null || specialist.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El especialista ({dto.SpecialistId}) no existe en la empresa activa.");

        if (!specialist.IsActive)
            throw new ConflictException("No se pueden agendar citas con un especialista inactivo.");

        var intervention = await _context.InterventionTypes.FindAsync(dto.InterventionTypeId);
        if (intervention == null || intervention.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El procedimiento ({dto.InterventionTypeId}) no existe en la empresa activa.");

        var reqStart = dto.ScheduledAt;
        var duration = dto.DurationMinutes > 0 ? dto.DurationMinutes : intervention.DurationMinutes;
        var reqEnd = reqStart.AddMinutes(duration);

        // Check for conflicting overlap: existing.Start < requested.End && requested.Start < existing.End
        var hasConflict = await _context.Schedulings
            .AnyAsync(s => s.SpecialistId == dto.SpecialistId &&
                           s.Status != AppointmentStatus.Cancelled &&
                           s.ScheduledAt < reqEnd &&
                           reqStart < s.ScheduledAt.AddMinutes(s.DurationMinutes));

        if (hasConflict)
        {
            throw new ConflictException($"El especialista ya tiene una cita reservada que se solapa con el horario seleccionado ({reqStart:HH:mm} - {reqEnd:HH:mm}).");
        }

        var scheduling = new Scheduling
        {
            CompanyId = CurrentCompanyId,
            PatientId = dto.PatientId,
            SpecialistId = dto.SpecialistId,
            InterventionTypeId = dto.InterventionTypeId,
            ScheduledAt = dto.ScheduledAt,
            DurationMinutes = duration,
            Notes = dto.Notes,
            Status = AppointmentStatus.Scheduled
        };

        await _context.Schedulings.AddAsync(scheduling);
        await _context.SaveChangesAsync();

        return new SchedulingDto(
            scheduling.Id,
            scheduling.CompanyId,
            scheduling.PatientId,
            $"{patient.FirstName} {patient.LastName}",
            patient.DocumentId,
            scheduling.SpecialistId,
            $"{specialist.FirstName} {specialist.LastName}",
            scheduling.InterventionTypeId,
            intervention.Name,
            scheduling.ScheduledAt,
            scheduling.DurationMinutes,
            scheduling.Notes,
            scheduling.Status,
            scheduling.CreatedAt
        );
    }

    public async Task<SchedulingDto> UpdateStatusAsync(Guid id, UpdateSchedulingStatusDto dto)
    {
        var scheduling = await _context.Schedulings
            .Include(s => s.Patient)
            .Include(s => s.Specialist)
            .Include(s => s.InterventionType)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (scheduling == null)
            throw new NotFoundException("Cita médica", id);

        if (_currentUserService.IsSpecialist && scheduling.SpecialistId != _currentUserService.SpecialistId)
            throw new ForbiddenAccessException("No tiene autorización para modificar el estado de citas de otros especialistas.");

        scheduling.Status = dto.Status;
        await _context.SaveChangesAsync();

        return new SchedulingDto(
            scheduling.Id,
            scheduling.CompanyId,
            scheduling.PatientId,
            $"{scheduling.Patient.FirstName} {scheduling.Patient.LastName}",
            scheduling.Patient.DocumentId,
            scheduling.SpecialistId,
            $"{scheduling.Specialist.FirstName} {scheduling.Specialist.LastName}",
            scheduling.InterventionTypeId,
            scheduling.InterventionType.Name,
            scheduling.ScheduledAt,
            scheduling.DurationMinutes,
            scheduling.Notes,
            scheduling.Status,
            scheduling.CreatedAt
        );
    }

    public async Task<SchedulingDto> RescheduleAsync(Guid id, RescheduleDto dto)
    {
        var scheduling = await _context.Schedulings
            .Include(s => s.Patient)
            .Include(s => s.Specialist)
            .Include(s => s.InterventionType)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (scheduling == null)
            throw new NotFoundException("Cita médica", id);

        if (_currentUserService.IsSpecialist && scheduling.SpecialistId != _currentUserService.SpecialistId)
            throw new ForbiddenAccessException("No tiene autorización para reagendar citas de otros especialistas.");

        var reqStart = dto.NewScheduledAt;
        var duration = dto.DurationMinutes > 0 ? dto.DurationMinutes : scheduling.DurationMinutes;
        var reqEnd = reqStart.AddMinutes(duration);

        // Check overlap excluding the current appointment
        var hasConflict = await _context.Schedulings
            .AnyAsync(s => s.Id != id &&
                           s.SpecialistId == scheduling.SpecialistId &&
                           s.Status != AppointmentStatus.Cancelled &&
                           s.ScheduledAt < reqEnd &&
                           reqStart < s.ScheduledAt.AddMinutes(s.DurationMinutes));

        if (hasConflict)
        {
            throw new ConflictException($"El especialista ya tiene una cita reservada que se solapa con el nuevo horario ({reqStart:HH:mm} - {reqEnd:HH:mm}).");
        }

        scheduling.ScheduledAt = dto.NewScheduledAt;
        scheduling.DurationMinutes = duration;
        scheduling.Status = AppointmentStatus.Scheduled;

        await _context.SaveChangesAsync();

        return new SchedulingDto(
            scheduling.Id,
            scheduling.CompanyId,
            scheduling.PatientId,
            $"{scheduling.Patient.FirstName} {scheduling.Patient.LastName}",
            scheduling.Patient.DocumentId,
            scheduling.SpecialistId,
            $"{scheduling.Specialist.FirstName} {scheduling.Specialist.LastName}",
            scheduling.InterventionTypeId,
            scheduling.InterventionType.Name,
            scheduling.ScheduledAt,
            scheduling.DurationMinutes,
            scheduling.Notes,
            scheduling.Status,
            scheduling.CreatedAt
        );
    }

    public async Task<bool> DeleteSchedulingAsync(Guid id)
    {
        var scheduling = await _context.Schedulings.FindAsync(id);
        if (scheduling == null)
            throw new NotFoundException("Cita médica", id);

        _context.Schedulings.Remove(scheduling);
        await _context.SaveChangesAsync();
        return true;
    }
}
