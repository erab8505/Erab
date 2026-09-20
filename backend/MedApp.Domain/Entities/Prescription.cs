using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class Prescription : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid? MedicalRecordId { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }

    public Guid SpecialistId { get; set; }
    public Specialist Specialist { get; set; } = null!;

    public DateTimeOffset PrescriptionDate { get; set; } = DateTimeOffset.UtcNow;
    public string? Notes { get; set; }

    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
}
