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
    Guid SpecialistId,
    string? SpecialistName,
    DateTimeOffset PrescriptionDate,
    string? Notes,
    List<PrescriptionItemDto> Items,
    DateTimeOffset CreatedAt
);

public record CreatePrescriptionDto(
    Guid PatientId,
    Guid? MedicalRecordId,
    Guid SpecialistId,
    DateTimeOffset? PrescriptionDate,
    string? Notes,
    List<CreatePrescriptionItemDto> Items
);
