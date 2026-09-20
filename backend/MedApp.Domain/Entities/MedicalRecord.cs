using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class MedicalRecord : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid? InterventionTypeId { get; set; }
    public InterventionType? InterventionType { get; set; }

    public DateTimeOffset RecordDate { get; set; } = DateTimeOffset.UtcNow;
    public string Diagnosis { get; set; } = string.Empty;
    public string? Treatment { get; set; }
    public string? Notes { get; set; }

    // Vital Signs
    public decimal? WeightKg { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public int? SystolicBP { get; set; }
    public int? DiastolicBP { get; set; }
    public int? HeartRateBpm { get; set; }
    public int? OxygenSaturation { get; set; }

    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
