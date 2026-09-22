using System.Globalization;
using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public EmployeeService(
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

    public async Task<List<EmployeeDto>> GetEmployeesAsync(Guid? specialtyId = null, bool onlyActive = true)
    {
        var query = _context.Employees
            .Include(e => e.Company)
            .Include(e => e.Specialty)
            .AsQueryable();

        // If user is a specialist without admin/receptionist roles, filter to self
        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin && !_currentUserService.IsReceptionist)
        {
            if (!_currentUserService.EmployeeId.HasValue)
            {
                return new List<EmployeeDto>();
            }
            query = query.Where(e => e.Id == _currentUserService.EmployeeId.Value);
        }

        if (specialtyId.HasValue)
        {
            query = query.Where(e => e.SpecialtyId == specialtyId.Value);
        }

        if (onlyActive)
        {
            query = query.Where(e => e.IsActive);
        }

        return await query
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .Select(e => new EmployeeDto(
                e.Id,
                e.CompanyId,
                e.Company.Name,
                e.FirstName,
                e.LastName,
                e.FullName,
                e.IdentificationNumber,
                e.LicenseNumber,
                e.JobTitle,
                e.SpecialtyId,
                e.Specialty != null ? e.Specialty.Name : null,
                e.Email,
                e.Phone,
                e.IsActive,
                e.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<EmployeeDto> GetEmployeeByIdAsync(Guid id)
    {
        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin && !_currentUserService.IsReceptionist)
        {
            if (id != _currentUserService.EmployeeId)
                throw new NotFoundException("Colaborador", id);
        }

        var e = await _context.Employees
            .Include(emp => emp.Company)
            .Include(emp => emp.Specialty)
            .FirstOrDefaultAsync(emp => emp.Id == id);

        if (e == null)
            throw new NotFoundException("Colaborador", id);

        return new EmployeeDto(
            e.Id,
            e.CompanyId,
            e.Company.Name,
            e.FirstName,
            e.LastName,
            e.FullName,
            e.IdentificationNumber,
            e.LicenseNumber,
            e.JobTitle,
            e.SpecialtyId,
            e.Specialty != null ? e.Specialty.Name : null,
            e.Email,
            e.Phone,
            e.IsActive,
            e.CreatedAt
        );
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto)
    {
        if (dto.SpecialtyId.HasValue)
        {
            var specialty = await _context.Specialties.FindAsync(dto.SpecialtyId.Value);
            if (specialty == null || specialty.CompanyId != CurrentCompanyId)
                throw new NotFoundException($"La especialidad ({dto.SpecialtyId.Value}) no pertenece a la empresa activa.");
        }

        if (!string.IsNullOrWhiteSpace(dto.IdentificationNumber))
        {
            var existsDoc = await _context.Employees
                .AnyAsync(e => e.CompanyId == CurrentCompanyId && e.IdentificationNumber == dto.IdentificationNumber);
            if (existsDoc)
                throw new ConflictException($"Ya existe un colaborador con la identificación '{dto.IdentificationNumber}' en esta empresa.");
        }

        if (!string.IsNullOrWhiteSpace(dto.LicenseNumber))
        {
            var existsLicense = await _context.Employees
                .AnyAsync(e => e.CompanyId == CurrentCompanyId && e.LicenseNumber == dto.LicenseNumber);
            if (existsLicense)
                throw new ConflictException($"Ya existe un colaborador con la matrícula / cédula profesional '{dto.LicenseNumber}' en esta empresa.");
        }

        var employee = new Employee
        {
            CompanyId = CurrentCompanyId,
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            IdentificationNumber = dto.IdentificationNumber?.Trim(),
            LicenseNumber = dto.LicenseNumber?.Trim(),
            JobTitle = dto.JobTitle?.Trim(),
            SpecialtyId = dto.SpecialtyId,
            Email = dto.Email?.Trim(),
            Phone = dto.Phone?.Trim(),
            IsActive = dto.IsActive ?? true
        };

        await _context.Employees.AddAsync(employee);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "CREATE",
            "Employees",
            employee.Id.ToString(),
            $"Creó el colaborador '{employee.FullName}' (Cargo: {employee.JobTitle ?? "No asignado"})",
            new { employee.FullName, employee.IdentificationNumber, employee.LicenseNumber, employee.JobTitle, employee.SpecialtyId }
        );

        return await GetEmployeeByIdAsync(employee.Id);
    }

    public async Task<EmployeeDto> UpdateEmployeeAsync(Guid id, UpdateEmployeeDto dto)
    {
        var employee = await _context.Employees
            .Include(e => e.Specialty)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null)
            throw new NotFoundException("Colaborador", id);

        if (dto.SpecialtyId.HasValue)
        {
            var specialty = await _context.Specialties.FindAsync(dto.SpecialtyId.Value);
            if (specialty == null || specialty.CompanyId != CurrentCompanyId)
                throw new NotFoundException($"La especialidad ({dto.SpecialtyId.Value}) no pertenece a la empresa activa.");
        }

        if (!string.IsNullOrWhiteSpace(dto.IdentificationNumber) && dto.IdentificationNumber != employee.IdentificationNumber)
        {
            var existsDoc = await _context.Employees
                .AnyAsync(e => e.CompanyId == CurrentCompanyId && e.IdentificationNumber == dto.IdentificationNumber && e.Id != id);
            if (existsDoc)
                throw new ConflictException($"Ya existe un colaborador con la identificación '{dto.IdentificationNumber}' en esta empresa.");
        }

        if (!string.IsNullOrWhiteSpace(dto.LicenseNumber) && dto.LicenseNumber != employee.LicenseNumber)
        {
            var existsLicense = await _context.Employees
                .AnyAsync(e => e.CompanyId == CurrentCompanyId && e.LicenseNumber == dto.LicenseNumber && e.Id != id);
            if (existsLicense)
                throw new ConflictException($"Ya existe un colaborador con la matrícula '{dto.LicenseNumber}' en esta empresa.");
        }

        employee.FirstName = dto.FirstName.Trim();
        employee.LastName = dto.LastName.Trim();
        employee.IdentificationNumber = dto.IdentificationNumber?.Trim();
        employee.LicenseNumber = dto.LicenseNumber?.Trim();
        employee.JobTitle = dto.JobTitle?.Trim();
        employee.SpecialtyId = dto.SpecialtyId;
        employee.Email = dto.Email?.Trim();
        employee.Phone = dto.Phone?.Trim();
        employee.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "UPDATE",
            "Employees",
            employee.Id.ToString(),
            $"Actualizó el colaborador '{employee.FullName}'",
            new { employee.FullName, employee.IdentificationNumber, employee.LicenseNumber, employee.JobTitle, employee.SpecialtyId, employee.IsActive }
        );

        return await GetEmployeeByIdAsync(employee.Id);
    }

    public async Task<bool> DeleteEmployeeAsync(Guid id)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null)
            throw new NotFoundException("Colaborador", id);

        var hasSchedulings = await _context.Schedulings.AnyAsync(s => s.EmployeeId == id);
        var hasPrescriptions = await _context.Prescriptions.AnyAsync(p => p.EmployeeId == id);
        var hasStudyOrders = await _context.StudyOrders.AnyAsync(so => so.RequestingDoctorId == id || so.LaboratoristId == id);
        var hasUsers = await _context.Users.AnyAsync(u => u.EmployeeId == id);

        if (hasSchedulings || hasPrescriptions || hasStudyOrders || hasUsers)
        {
            throw new ConflictException("No se puede eliminar el colaborador porque registra historial de citas, recetas, órdenes o un usuario vinculado. Puede desactivar su registro en su lugar.");
        }

        var fullName = employee.FullName;
        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "DELETE",
            "Employees",
            id.ToString(),
            $"Eliminó el colaborador '{fullName}'"
        );

        return true;
    }

    public async Task<List<EmployeeAvailabilityDto>> GetEmployeeAvailabilitiesAsync(Guid employeeId)
    {
        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin && !_currentUserService.IsReceptionist)
        {
            if (employeeId != _currentUserService.EmployeeId)
                throw new ForbiddenAccessException("No tiene autorización para consultar la disponibilidad de otros colaboradores.");
        }

        var availabilities = await _context.EmployeeAvailabilities
            .Where(ea => ea.EmployeeId == employeeId)
            .OrderBy(ea => ea.DayOfWeek)
            .ThenBy(ea => ea.StartHour)
            .ToListAsync();

        return availabilities.Select(ea => new EmployeeAvailabilityDto(
            ea.Id,
            ea.EmployeeId,
            ea.DayOfWeek,
            GetDayName(ea.DayOfWeek),
            ea.StartHour,
            ea.EndHour
        )).ToList();
    }

    public async Task<List<EmployeeAvailabilityDto>> SetEmployeeAvailabilitiesAsync(Guid employeeId, List<SetEmployeeAvailabilityDto> availabilities)
    {
        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin)
        {
            if (employeeId != _currentUserService.EmployeeId)
                throw new ForbiddenAccessException("No tiene autorización para modificar la disponibilidad de otros colaboradores.");
        }

        var employee = await _context.Employees.FindAsync(employeeId);
        if (employee == null)
            throw new NotFoundException("Colaborador", employeeId);

        var existing = await _context.EmployeeAvailabilities
            .Where(ea => ea.EmployeeId == employeeId)
            .ToListAsync();

        _context.EmployeeAvailabilities.RemoveRange(existing);

        var newEntities = new List<EmployeeAvailability>();
        foreach (var item in availabilities)
        {
            newEntities.Add(new EmployeeAvailability
            {
                EmployeeId = employeeId,
                DayOfWeek = item.DayOfWeek,
                StartHour = item.StartHour,
                EndHour = item.EndHour
            });
        }

        await _context.EmployeeAvailabilities.AddRangeAsync(newEntities);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "UPDATE",
            "EmployeeAvailabilities",
            employeeId.ToString(),
            $"Actualizó los horarios de atención para '{employee.FullName}'"
        );

        return await GetEmployeeAvailabilitiesAsync(employeeId);
    }

    public async Task<List<TimeSlotDto>> GetAvailableSlotsAsync(Guid employeeId, DateOnly date, int durationMinutes = 30)
    {
        if (_currentUserService.IsSpecialist && !_currentUserService.IsAdmin && !_currentUserService.IsReceptionist)
        {
            if (employeeId != _currentUserService.EmployeeId)
                throw new ForbiddenAccessException("No tiene autorización para consultar los turnos de otros especialistas.");
        }

        var employee = await _context.Employees.FindAsync(employeeId);
        if (employee == null)
            throw new NotFoundException("Colaborador", employeeId);

        if (!employee.IsActive)
            return new List<TimeSlotDto>();

        var dayOfWeek = (int)date.DayOfWeek;

        var availabilities = await _context.EmployeeAvailabilities
            .Where(ea => ea.EmployeeId == employeeId && ea.DayOfWeek == dayOfWeek)
            .OrderBy(ea => ea.StartHour)
            .ToListAsync();

        if (!availabilities.Any())
            return new List<TimeSlotDto>();

        var dayStartUtc = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var dayEndUtc = dayStartUtc.AddDays(1);

        var existingBookings = await _context.Schedulings
            .Where(s => s.EmployeeId == employeeId &&
                        s.Status != AppointmentStatus.Cancelled &&
                        s.ScheduledAt >= dayStartUtc &&
                        s.ScheduledAt < dayEndUtc)
            .ToListAsync();

        var nowUtc = DateTimeOffset.UtcNow;
        var slots = new List<TimeSlotDto>();
        var slotInterval = durationMinutes > 0 ? durationMinutes : 30;

        foreach (var avail in availabilities)
        {
            var start = TimeSpan.Parse(avail.StartHour);
            var end = TimeSpan.Parse(avail.EndHour);

            var current = start;
            while (current.Add(TimeSpan.FromMinutes(slotInterval)) <= end)
            {
                var slotDateTimeUtc = new DateTimeOffset(date.ToDateTime(TimeOnly.FromTimeSpan(current)), TimeSpan.Zero);
                var slotEndDateTimeUtc = slotDateTimeUtc.AddMinutes(slotInterval);

                var isPast = slotDateTimeUtc < nowUtc;
                var isBooked = existingBookings.Any(b =>
                {
                    var bookingStart = b.ScheduledAt;
                    var bookingEnd = b.ScheduledAt.AddMinutes(b.DurationMinutes);
                    return bookingStart < slotEndDateTimeUtc && slotDateTimeUtc < bookingEnd;
                });

                slots.Add(new TimeSlotDto(slotDateTimeUtc, slotEndDateTimeUtc, !isPast && !isBooked));
                current = current.Add(TimeSpan.FromMinutes(slotInterval));
            }
        }

        return slots;
    }

    private static string GetDayName(int dayOfWeek)
    {
        return dayOfWeek switch
        {
            0 => "Domingo",
            1 => "Lunes",
            2 => "Martes",
            3 => "Miércoles",
            4 => "Jueves",
            5 => "Viernes",
            6 => "Sábado",
            _ => "Día " + dayOfWeek
        };
    }
}
