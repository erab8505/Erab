using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IPatientService
{
    Task<List<PatientDto>> SearchPatientsAsync(string? query = null);
    Task<PatientDto> GetPatientByIdAsync(Guid id);
    Task<PatientDto> CreatePatientAsync(CreatePatientDto dto);
    Task<PatientDto> UpdatePatientAsync(Guid id, UpdatePatientDto dto);
    Task<bool> DeletePatientAsync(Guid id);
}
