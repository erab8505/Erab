using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class InterventionType : BaseEntity
{
    public Guid SpecialtyId { get; set; }
    public Specialty Specialty { get; set; } = null!;

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public bool RequiresAnesthesia { get; set; }
    public bool RequiresHospitalization { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Scheduling> Schedulings { get; set; } = new List<Scheduling>();
    public ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();
}
