using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class PatientDocument : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid? MedicalRecordId { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }

    public string Title { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;

    public DocumentCategory Category { get; set; } = DocumentCategory.Other;
    public string? Description { get; set; }
    public Guid? UploadedByUserId { get; set; }
}
