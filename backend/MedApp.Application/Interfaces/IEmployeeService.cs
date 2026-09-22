using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IEmployeeService
{
    Task<List<EmployeeDto>> GetEmployeesAsync(Guid? specialtyId = null, bool onlyActive = true);
    Task<EmployeeDto> GetEmployeeByIdAsync(Guid id);
    Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto);
    Task<EmployeeDto> UpdateEmployeeAsync(Guid id, UpdateEmployeeDto dto);
    Task<bool> DeleteEmployeeAsync(Guid id);

    Task<List<EmployeeAvailabilityDto>> GetEmployeeAvailabilitiesAsync(Guid employeeId);
    Task<List<EmployeeAvailabilityDto>> SetEmployeeAvailabilitiesAsync(Guid employeeId, List<SetEmployeeAvailabilityDto> availabilities);
    Task<List<TimeSlotDto>> GetAvailableSlotsAsync(Guid employeeId, DateOnly date, int durationMinutes = 30);
}
