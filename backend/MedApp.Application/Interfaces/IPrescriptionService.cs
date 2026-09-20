using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IPrescriptionService
{
    Task<List<PrescriptionDto>> GetPrescriptionsByPatientAsync(Guid patientId);
    Task<PrescriptionDto> GetPrescriptionByIdAsync(Guid id);
    Task<PrescriptionDto> CreatePrescriptionAsync(CreatePrescriptionDto dto);
    Task<bool> DeletePrescriptionAsync(Guid id);
}
