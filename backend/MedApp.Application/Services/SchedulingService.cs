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
    private readonly IAuditService _auditService;

    public SchedulingService(
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
            .Include(s => s.Employee)
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

        // If the logged-in user is a specialist without admin/receptionist role, force their own EmployeeId
        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin && !_currentUserService.IsReceptionist)
        {
            if (!_currentUserService.EmployeeId.HasValue)
            {
                return new List<SchedulingDto>();
            }
            query = query.Where(s => s.EmployeeId == _currentUserService.EmployeeId.Value);
        }
        else if (specialistId.HasValue)
        {
            query = query.Where(s => s.EmployeeId == specialistId.Value);
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
                s.EmployeeId,
                s.Employee != null ? $"{s.Employee.FirstName} {s.Employee.LastName}" : null,
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
            .Include(sc => sc.Employee)
            .Include(sc => sc.InterventionType)
            .FirstOrDefaultAsync(sc => sc.Id == id);

        if (s == null)
            throw new NotFoundException("Cita médica", id);

        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin && !_currentUserService.IsReceptionist)
        {
            if (s.EmployeeId != _currentUserService.EmployeeId)
                throw new NotFoundException("Cita médica", id);
        }

        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.SchedulingId == id);

        return new SchedulingDto(
            s.Id,
            s.CompanyId,
            s.PatientId,
            $"{s.Patient.FirstName} {s.Patient.LastName}",
            s.Patient.DocumentId,
            s.EmployeeId,
            s.Employee != null ? $"{s.Employee.FirstName} {s.Employee.LastName}" : null,
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
        var employeeId = dto.EmployeeId != Guid.Empty ? dto.EmployeeId : (dto.SpecialistId ?? Guid.Empty);

        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin && !_currentUserService.IsReceptionist)
        {
            if (!_currentUserService.EmployeeId.HasValue || employeeId != _currentUserService.EmployeeId.Value)
            {
                throw new ForbiddenAccessException("Un especialista solo puede agendar citas para su propio perfil profesional.");
            }
        }

        var patient = await _context.Patients.FindAsync(dto.PatientId);
        if (patient == null || patient.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El paciente ({dto.PatientId}) no existe en la empresa activa.");

        var employee = await _context.Employees.FindAsync(employeeId);
        if (employee == null || employee.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El colaborador ({employeeId}) no existe en la empresa activa.");

        if (!employee.IsActive)
            throw new ConflictException("No se pueden agendar citas con un colaborador inactivo.");

        var intervention = await _context.InterventionTypes.FindAsync(dto.InterventionTypeId);
        if (intervention == null || intervention.CompanyId != CurrentCompanyId)
            throw new NotFoundException($"El procedimiento ({dto.InterventionTypeId}) no existe en la empresa activa.");

        var reqStart = dto.ScheduledAt;
        var duration = dto.DurationMinutes > 0 ? dto.DurationMinutes : intervention.DurationMinutes;
        var reqEnd = reqStart.AddMinutes(duration);

        // Check for conflicting overlap: existing.Start < requested.End && requested.Start < existing.End
        var hasConflict = await _context.Schedulings
            .AnyAsync(s => s.EmployeeId == employeeId &&
                           s.Status != AppointmentStatus.Cancelled &&
                           s.ScheduledAt < reqEnd &&
                           reqStart < s.ScheduledAt.AddMinutes(s.DurationMinutes));

        if (hasConflict)
        {
            throw new ConflictException($"El profesional ya tiene una cita reservada que se solapa con el horario seleccionado ({reqStart:HH:mm} - {reqEnd:HH:mm}).");
        }

        var scheduling = new Scheduling
        {
            CompanyId = CurrentCompanyId,
            PatientId = dto.PatientId,
            EmployeeId = employeeId,
            InterventionTypeId = dto.InterventionTypeId,
            ScheduledAt = dto.ScheduledAt,
            DurationMinutes = duration,
            Notes = dto.Notes,
            Status = AppointmentStatus.Scheduled
        };

        await _context.Schedulings.AddAsync(scheduling);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "CREATE",
            "Scheduling",
            scheduling.Id.ToString(),
            $"Agendó cita para el paciente '{patient.FirstName} {patient.LastName}' con el profesional '{employee.FirstName} {employee.LastName}' para el {scheduling.ScheduledAt:yyyy-MM-dd HH:mm}"
        );

        return new SchedulingDto(
            scheduling.Id,
            scheduling.CompanyId,
            scheduling.PatientId,
            $"{patient.FirstName} {patient.LastName}",
            patient.DocumentId,
            scheduling.EmployeeId,
            $"{employee.FirstName} {employee.LastName}",
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
            .Include(s => s.Employee)
            .Include(s => s.InterventionType)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (scheduling == null)
            throw new NotFoundException("Cita médica", id);

        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin && !_currentUserService.IsReceptionist)
        {
            if (scheduling.EmployeeId != _currentUserService.EmployeeId)
                throw new ForbiddenAccessException("No tiene autorización para modificar el estado de citas de otros profesionales.");
        }

        var oldStatus = scheduling.Status;
        scheduling.Status = dto.Status;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "STATUS_CHANGE",
            "Scheduling",
            scheduling.Id.ToString(),
            $"Cambió el estado de la cita del paciente '{scheduling.Patient.FirstName} {scheduling.Patient.LastName}' de '{oldStatus}' a '{dto.Status}'"
        );

        return new SchedulingDto(
            scheduling.Id,
            scheduling.CompanyId,
            scheduling.PatientId,
            $"{scheduling.Patient.FirstName} {scheduling.Patient.LastName}",
            scheduling.Patient.DocumentId,
            scheduling.EmployeeId,
            scheduling.Employee != null ? $"{scheduling.Employee.FirstName} {scheduling.Employee.LastName}" : null,
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
            .Include(s => s.Employee)
            .Include(s => s.InterventionType)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (scheduling == null)
            throw new NotFoundException("Cita médica", id);

        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin && !_currentUserService.IsReceptionist)
        {
            if (scheduling.EmployeeId != _currentUserService.EmployeeId)
                throw new ForbiddenAccessException("No tiene autorización para reagendar citas de otros profesionales.");
        }

        var reqStart = dto.NewScheduledAt;
        var duration = dto.DurationMinutes > 0 ? dto.DurationMinutes : scheduling.DurationMinutes;
        var reqEnd = reqStart.AddMinutes(duration);

        // Check overlap excluding the current appointment
        var hasConflict = await _context.Schedulings
            .AnyAsync(s => s.Id != id &&
                           s.EmployeeId == scheduling.EmployeeId &&
                           s.Status != AppointmentStatus.Cancelled &&
                           s.ScheduledAt < reqEnd &&
                           reqStart < s.ScheduledAt.AddMinutes(s.DurationMinutes));

        if (hasConflict)
        {
            throw new ConflictException($"El profesional ya tiene una cita reservada que se solapa con el nuevo horario ({reqStart:HH:mm} - {reqEnd:HH:mm}).");
        }

        var oldDate = scheduling.ScheduledAt;
        scheduling.ScheduledAt = dto.NewScheduledAt;
        scheduling.DurationMinutes = duration;
        scheduling.Status = AppointmentStatus.Scheduled;

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "RESCHEDULE",
            "Scheduling",
            scheduling.Id.ToString(),
            $"Reagendó la cita del paciente '{scheduling.Patient.FirstName} {scheduling.Patient.LastName}' del {oldDate:yyyy-MM-dd HH:mm} al {dto.NewScheduledAt:yyyy-MM-dd HH:mm}"
        );

        return new SchedulingDto(
            scheduling.Id,
            scheduling.CompanyId,
            scheduling.PatientId,
            $"{scheduling.Patient.FirstName} {scheduling.Patient.LastName}",
            scheduling.Patient.DocumentId,
            scheduling.EmployeeId,
            scheduling.Employee != null ? $"{scheduling.Employee.FirstName} {scheduling.Employee.LastName}" : null,
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
        var scheduling = await _context.Schedulings
            .Include(s => s.Patient)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (scheduling == null)
            throw new NotFoundException("Cita médica", id);

        var patientName = scheduling.Patient != null ? $"{scheduling.Patient.FirstName} {scheduling.Patient.LastName}" : "N/A";
        var date = scheduling.ScheduledAt;

        _context.Schedulings.Remove(scheduling);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "DELETE",
            "Scheduling",
            id.ToString(),
            $"Eliminó la cita del paciente '{patientName}' programada para el {date:yyyy-MM-dd HH:mm}"
        );

        return true;
    }
}
