using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface ISpecialistAvailabilityService
{
    Task<List<SpecialistAvailabilityDto>> GetAvailabilityBySpecialistAsync(Guid specialistId);
    Task<SpecialistAvailabilityDto> AddAvailabilityAsync(CreateSpecialistAvailabilityDto dto);
    Task<bool> DeleteAvailabilityAsync(Guid id);
    Task<List<TimeSlotDto>> GetAvailableSlotsAsync(Guid specialistId, DateOnly date);
}
