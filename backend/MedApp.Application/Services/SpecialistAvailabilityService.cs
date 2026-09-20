using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class SpecialistAvailabilityService : ISpecialistAvailabilityService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SpecialistAvailabilityService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<SpecialistAvailabilityDto>> GetAvailabilityBySpecialistAsync(Guid specialistId)
    {
        if (_currentUserService.IsSpecialist && specialistId != _currentUserService.SpecialistId)
            throw new ForbiddenAccessException("No tiene autorización para consultar la disponibilidad de otros especialistas.");

        return await _context.SpecialistAvailabilities
            .Where(sa => sa.SpecialistId == specialistId)
            .OrderBy(sa => sa.DayOfWeek)
            .ThenBy(sa => sa.StartHour)
            .Select(sa => new SpecialistAvailabilityDto(
                sa.Id, sa.SpecialistId, sa.DayOfWeek, sa.StartHour, sa.EndHour
            ))
            .ToListAsync();
    }

    public async Task<SpecialistAvailabilityDto> AddAvailabilityAsync(CreateSpecialistAvailabilityDto dto)
    {
        if (_currentUserService.IsSpecialist && dto.SpecialistId != _currentUserService.SpecialistId)
            throw new ForbiddenAccessException("No tiene autorización para configurar disponibilidad para otros especialistas.");

        var specialist = await _context.Specialists.FindAsync(dto.SpecialistId);
        if (specialist == null)
            throw new NotFoundException("Especialista", dto.SpecialistId);

        // Check if overlaps with an existing availability for the same specialist and day
        var existing = await _context.SpecialistAvailabilities
            .Where(sa => sa.SpecialistId == dto.SpecialistId && sa.DayOfWeek == dto.DayOfWeek)
            .ToListAsync();

        var newStart = TimeSpan.Parse(dto.StartHour);
        var newEnd = TimeSpan.Parse(dto.EndHour);

        foreach (var ex in existing)
        {
            var exStart = TimeSpan.Parse(ex.StartHour);
            var exEnd = TimeSpan.Parse(ex.EndHour);

            if (exStart < newEnd && newStart < exEnd)
            {
                throw new ConflictException($"El horario {dto.StartHour}-{dto.EndHour} se solapa con la disponibilidad existente {ex.StartHour}-{ex.EndHour}.");
            }
        }

        var availability = new SpecialistAvailability
        {
            SpecialistId = dto.SpecialistId,
            DayOfWeek = dto.DayOfWeek,
            StartHour = dto.StartHour,
            EndHour = dto.EndHour
        };

        await _context.SpecialistAvailabilities.AddAsync(availability);
        await _context.SaveChangesAsync();

        return new SpecialistAvailabilityDto(
            availability.Id, availability.SpecialistId, availability.DayOfWeek,
            availability.StartHour, availability.EndHour
        );
    }

    public async Task<bool> DeleteAvailabilityAsync(Guid id)
    {
        var availability = await _context.SpecialistAvailabilities.FindAsync(id);
        if (availability == null)
            throw new NotFoundException("Disponibilidad", id);

        if (_currentUserService.IsSpecialist && availability.SpecialistId != _currentUserService.SpecialistId)
            throw new ForbiddenAccessException("No tiene autorización para eliminar la disponibilidad de otros especialistas.");

        _context.SpecialistAvailabilities.Remove(availability);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<TimeSlotDto>> GetAvailableSlotsAsync(Guid specialistId, DateOnly date)
    {
        if (_currentUserService.IsSpecialist && specialistId != _currentUserService.SpecialistId)
            throw new ForbiddenAccessException("No tiene autorización para consultar los turnos de otros especialistas.");

        var specialist = await _context.Specialists.FindAsync(specialistId);
        if (specialist == null)
            throw new NotFoundException("Especialista", specialistId);

        if (!specialist.IsActive)
            return new List<TimeSlotDto>();

        var dayOfWeek = (int)date.DayOfWeek;

        var availabilities = await _context.SpecialistAvailabilities
            .Where(sa => sa.SpecialistId == specialistId && sa.DayOfWeek == dayOfWeek)
            .OrderBy(sa => sa.StartHour)
            .ToListAsync();

        if (!availabilities.Any())
            return new List<TimeSlotDto>();

        // Query existing non-cancelled bookings on that date (UTC day bounds)
        var dayStartUtc = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var dayEndUtc = dayStartUtc.AddDays(1);

        var existingBookings = await _context.Schedulings
            .Where(s => s.SpecialistId == specialistId &&
                        s.Status != AppointmentStatus.Cancelled &&
                        s.ScheduledAt >= dayStartUtc &&
                        s.ScheduledAt < dayEndUtc)
            .ToListAsync();

        var nowUtc = DateTimeOffset.UtcNow;
        var slots = new List<TimeSlotDto>();

        foreach (var avail in availabilities)
        {
            var start = TimeSpan.Parse(avail.StartHour);
            var end = TimeSpan.Parse(avail.EndHour);

            var current = start;
            while (current.Add(TimeSpan.FromMinutes(30)) <= end)
            {
                var slotTimeStr = $"{current.Hours:D2}:{current.Minutes:D2}";
                var slotDateTimeUtc = new DateTimeOffset(date.ToDateTime(TimeOnly.FromTimeSpan(current)), TimeSpan.Zero);
                var slotEndDateTimeUtc = slotDateTimeUtc.AddMinutes(30);

                // Slot is in the past
                var isPast = slotDateTimeUtc < nowUtc;

                // Check overlap with existing bookings: existing.Start < slot.End && slot.Start < existing.End
                var isBooked = existingBookings.Any(b =>
                {
                    var bookingStart = b.ScheduledAt;
                    var bookingEnd = b.ScheduledAt.AddMinutes(b.DurationMinutes);
                    return bookingStart < slotEndDateTimeUtc && slotDateTimeUtc < bookingEnd;
                });

                var isAvailable = !isPast && !isBooked;

                slots.Add(new TimeSlotDto(slotDateTimeUtc, slotEndDateTimeUtc, isAvailable));

                current = current.Add(TimeSpan.FromMinutes(30));
            }
        }

        return slots;
    }
}
