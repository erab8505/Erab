using FluentValidation;
using MedApp.Application.DTOs;

namespace MedApp.Application.Validators;

public class CreateEmployeeDtoValidator : AbstractValidator<CreateEmployeeDto>
{
    public CreateEmployeeDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.IdentificationNumber).MaximumLength(50);
        RuleFor(x => x.LicenseNumber).MaximumLength(50);
        RuleFor(x => x.JobTitle).MaximumLength(150);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).MaximumLength(150);
        RuleFor(x => x.Phone).MaximumLength(50);
    }
}

public class UpdateEmployeeDtoValidator : AbstractValidator<UpdateEmployeeDto>
{
    public UpdateEmployeeDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.IdentificationNumber).MaximumLength(50);
        RuleFor(x => x.LicenseNumber).MaximumLength(50);
        RuleFor(x => x.JobTitle).MaximumLength(150);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).MaximumLength(150);
        RuleFor(x => x.Phone).MaximumLength(50);
    }
}

public class SetEmployeeAvailabilityDtoValidator : AbstractValidator<SetEmployeeAvailabilityDto>
{
    public SetEmployeeAvailabilityDtoValidator()
    {
        RuleFor(x => x.DayOfWeek).InclusiveBetween(0, 6).WithMessage("El día de la semana debe ser entre 0 (Domingo) y 6 (Sábado).");
        RuleFor(x => x.StartHour).NotEmpty().Matches(@"^([01]\d|2[0-3]):[0-5]\d$").WithMessage("StartHour debe tener el formato HH:mm.");
        RuleFor(x => x.EndHour).NotEmpty().Matches(@"^([01]\d|2[0-3]):[0-5]\d$").WithMessage("EndHour debe tener el formato HH:mm.");
        RuleFor(x => x)
            .Must(x => string.Compare(x.StartHour, x.EndHour, StringComparison.Ordinal) < 0)
            .WithMessage("La hora de inicio debe ser anterior a la hora de fin.");
    }
}
