using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public record PatientDocumentDto(
    Guid Id,
    Guid CompanyId,
    Guid PatientId,
    Guid? MedicalRecordId,
    string Title,
    string FileName,
    string OriginalFileName,
    string ContentType,
    long FileSizeBytes,
    DocumentCategory Category,
    string? Description,
    DateTimeOffset CreatedAt
);

public record UpdatePatientDocumentDto(
    string Title,
    DocumentCategory Category,
    string? Description
);
