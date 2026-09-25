namespace MedApp.Application.DTOs;

public record MedicalRecordDto(
    Guid Id,
    Guid CompanyId,
    Guid PatientId,
    string? PatientName,
    Guid? InterventionTypeId,
    string? InterventionTypeName,
    DateTimeOffset RecordDate,
    string Diagnosis,
    string? Treatment,
    string? Notes,
    decimal? WeightKg,
    decimal? HeightCm,
    decimal? TemperatureCelsius,
    int? SystolicBP,
    int? DiastolicBP,
    int? HeartRateBpm,
    int? OxygenSaturation,
    DateTimeOffset CreatedAt
);

public record CreateMedicalRecordDto(
    Guid PatientId,
    Guid? InterventionTypeId,
    DateTimeOffset? RecordDate,
    string Diagnosis,
    string? Treatment,
    string? Notes,
    decimal? WeightKg,
    decimal? HeightCm,
    decimal? TemperatureCelsius,
    int? SystolicBP,
    int? DiastolicBP,
    int? HeartRateBpm,
    int? OxygenSaturation
);

public record UpdateMedicalRecordDto(
    Guid? InterventionTypeId,
    string Diagnosis,
    string? Treatment,
    string? Notes,
    decimal? WeightKg,
    decimal? HeightCm,
    decimal? TemperatureCelsius,
    int? SystolicBP,
    int? DiastolicBP,
    int? HeartRateBpm,
    int? OxygenSaturation
);

public record PrescriptionItemDto(
    Guid Id,
    Guid PrescriptionId,
    string MedicationName,
    string Dosage,
    string Frequency,
    int DurationDays,
    string? Instructions
);

public record CreatePrescriptionItemDto(
    string MedicationName,
    string Dosage,
    string Frequency,
    int DurationDays,
    string? Instructions
);

public record PrescriptionDto(
    Guid Id,
    Guid CompanyId,
    Guid PatientId,
    string? PatientName,
    Guid? MedicalRecordId,
    Guid EmployeeId,
    string? EmployeeName,
    DateTimeOffset PrescriptionDate,
    string? Notes,
    List<PrescriptionItemDto> Items,
    DateTimeOffset CreatedAt
)
{
    public Guid SpecialistId => EmployeeId;
    public string? SpecialistName => EmployeeName;
}

public class CreatePrescriptionDto
{
    public Guid PatientId { get; set; }
    public Guid? MedicalRecordId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid? SpecialistId
    {
        get => EmployeeId;
        set
        {
            if (value.HasValue && value.Value != Guid.Empty)
            {
                EmployeeId = value.Value;
            }
        }
    }
    public DateTimeOffset? PrescriptionDate { get; set; }
    public string? Notes { get; set; }
    public List<CreatePrescriptionItemDto> Items { get; set; } = new();

    public CreatePrescriptionDto() { }

    public CreatePrescriptionDto(Guid patientId, Guid? medicalRecordId, Guid employeeId, DateTimeOffset? prescriptionDate, string? notes, List<CreatePrescriptionItemDto> items, Guid? specialistId = null)
    {
        PatientId = patientId;
        MedicalRecordId = medicalRecordId;
        EmployeeId = employeeId != Guid.Empty ? employeeId : (specialistId ?? Guid.Empty);
        PrescriptionDate = prescriptionDate;
        Notes = notes;
        Items = items;
    }
}
