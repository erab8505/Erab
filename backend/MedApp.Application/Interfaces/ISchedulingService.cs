using MedApp.Application.DTOs;
using MedApp.Domain.Enums;

namespace MedApp.Application.Interfaces;

public interface ISchedulingService
{
    Task<List<SchedulingDto>> GetSchedulingsAsync(
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        Guid? specialistId = null,
        Guid? patientId = null,
        AppointmentStatus? status = null);
    Task<SchedulingDto> GetSchedulingByIdAsync(Guid id);
    Task<SchedulingDto> CreateSchedulingAsync(CreateSchedulingDto dto);
    Task<SchedulingDto> UpdateStatusAsync(Guid id, UpdateSchedulingStatusDto dto);
    Task<SchedulingDto> RescheduleAsync(Guid id, RescheduleDto dto);
    Task<bool> DeleteSchedulingAsync(Guid id);
}
