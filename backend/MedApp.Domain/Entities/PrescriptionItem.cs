using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class PrescriptionItem : BaseEntity
{
    public Guid PrescriptionId { get; set; }
    public Prescription Prescription { get; set; } = null!;

    public string MedicationName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int DurationDays { get; set; } = 1;
    public string? Instructions { get; set; }
}
