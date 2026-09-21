using MedApp.Application.DTOs;
using MedApp.Domain.Enums;

namespace MedApp.Application.Interfaces;

public interface IPatientDocumentService
{
    Task<List<PatientDocumentDto>> GetDocumentsByPatientIdAsync(Guid patientId, DocumentCategory? category = null);
    Task<PatientDocumentDto?> GetDocumentByIdAsync(Guid id);
    Task<PatientDocumentDto> UploadDocumentAsync(Guid patientId, string title, DocumentCategory category, string? description, Guid? medicalRecordId, string originalFileName, string contentType, long fileSize, Stream fileStream);
    Task<(Stream Stream, string ContentType, string FileName)> DownloadDocumentAsync(Guid id);
    Task<bool> DeleteDocumentAsync(Guid id);
}
