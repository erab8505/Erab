using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IMedicalRecordService
{
    Task<List<MedicalRecordDto>> GetMedicalRecordsByPatientAsync(Guid patientId);
    Task<MedicalRecordDto> GetMedicalRecordByIdAsync(Guid id);
    Task<MedicalRecordDto> CreateMedicalRecordAsync(CreateMedicalRecordDto dto);
    Task<MedicalRecordDto> UpdateMedicalRecordAsync(Guid id, UpdateMedicalRecordDto dto);
    Task<bool> DeleteMedicalRecordAsync(Guid id);
}
