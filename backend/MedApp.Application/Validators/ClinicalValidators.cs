using FluentValidation;
using MedApp.Application.DTOs;

namespace MedApp.Application.Validators;

public class CreateMedicalRecordDtoValidator : AbstractValidator<CreateMedicalRecordDto>
{
    public CreateMedicalRecordDtoValidator()
    {
        RuleFor(x => x.PatientId).NotEmpty();
        RuleFor(x => x.Diagnosis).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.WeightKg).InclusiveBetween(0.1m, 500m).When(x => x.WeightKg.HasValue);
        RuleFor(x => x.HeightCm).InclusiveBetween(10m, 300m).When(x => x.HeightCm.HasValue);
        RuleFor(x => x.TemperatureCelsius).InclusiveBetween(25.0m, 45.0m).When(x => x.TemperatureCelsius.HasValue);
        RuleFor(x => x.SystolicBP).InclusiveBetween(30, 300).When(x => x.SystolicBP.HasValue);
        RuleFor(x => x.DiastolicBP).InclusiveBetween(20, 200).When(x => x.DiastolicBP.HasValue);
        RuleFor(x => x.HeartRateBpm).InclusiveBetween(20, 300).When(x => x.HeartRateBpm.HasValue);
        RuleFor(x => x.OxygenSaturation).InclusiveBetween(50, 100).When(x => x.OxygenSaturation.HasValue);
    }
}

public class UpdateMedicalRecordDtoValidator : AbstractValidator<UpdateMedicalRecordDto>
{
    public UpdateMedicalRecordDtoValidator()
    {
        RuleFor(x => x.Diagnosis).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.WeightKg).InclusiveBetween(0.1m, 500m).When(x => x.WeightKg.HasValue);
        RuleFor(x => x.HeightCm).InclusiveBetween(10m, 300m).When(x => x.HeightCm.HasValue);
        RuleFor(x => x.TemperatureCelsius).InclusiveBetween(25.0m, 45.0m).When(x => x.TemperatureCelsius.HasValue);
        RuleFor(x => x.SystolicBP).InclusiveBetween(30, 300).When(x => x.SystolicBP.HasValue);
        RuleFor(x => x.DiastolicBP).InclusiveBetween(20, 200).When(x => x.DiastolicBP.HasValue);
        RuleFor(x => x.HeartRateBpm).InclusiveBetween(20, 300).When(x => x.HeartRateBpm.HasValue);
        RuleFor(x => x.OxygenSaturation).InclusiveBetween(50, 100).When(x => x.OxygenSaturation.HasValue);
    }
}

public class CreatePrescriptionItemDtoValidator : AbstractValidator<CreatePrescriptionItemDto>
{
    public CreatePrescriptionItemDtoValidator()
    {
        RuleFor(x => x.MedicationName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Dosage).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Frequency).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DurationDays).GreaterThan(0).WithMessage("Duration in days must be greater than 0.");
        RuleFor(x => x.Instructions).MaximumLength(500);
    }
}

public class CreatePrescriptionDtoValidator : AbstractValidator<CreatePrescriptionDto>
{
    public CreatePrescriptionDtoValidator()
    {
        RuleFor(x => x.PatientId).NotEmpty();
        RuleFor(x => x.EmployeeId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("Prescription must contain at least one medication item.");
        RuleForEach(x => x.Items).SetValidator(new CreatePrescriptionItemDtoValidator());
        RuleFor(x => x.Notes).MaximumLength(2000);
    }
}
