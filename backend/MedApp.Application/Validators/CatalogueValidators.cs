using System.Text.RegularExpressions;
using FluentValidation;
using MedApp.Application.DTOs;

namespace MedApp.Application.Validators;

public class CreateAreaDtoValidator : AbstractValidator<CreateAreaDto>
{
    public CreateAreaDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}

public class UpdateAreaDtoValidator : AbstractValidator<UpdateAreaDto>
{
    public UpdateAreaDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}

public class CreateSpecialtyDtoValidator : AbstractValidator<CreateSpecialtyDto>
{
    public CreateSpecialtyDtoValidator()
    {
        RuleFor(x => x.AreaId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}

public class UpdateSpecialtyDtoValidator : AbstractValidator<UpdateSpecialtyDto>
{
    public UpdateSpecialtyDtoValidator()
    {
        RuleFor(x => x.AreaId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}

public class CreateSpecialistDtoValidator : AbstractValidator<CreateSpecialistDto>
{
    public CreateSpecialistDtoValidator()
    {
        RuleFor(x => x.SpecialtyId).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LicenseNumber).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(30);
    }
}

public class UpdateSpecialistDtoValidator : AbstractValidator<UpdateSpecialistDto>
{
    public UpdateSpecialistDtoValidator()
    {
        RuleFor(x => x.SpecialtyId).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LicenseNumber).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(30);
    }
}

public class CreateSpecialistAvailabilityDtoValidator : AbstractValidator<CreateSpecialistAvailabilityDto>
{
    public CreateSpecialistAvailabilityDtoValidator()
    {
        RuleFor(x => x.SpecialistId).NotEmpty();
        RuleFor(x => x.DayOfWeek).InclusiveBetween(0, 6).WithMessage("Day of week must be between 0 (Sunday) and 6 (Saturday).");
        RuleFor(x => x.StartHour).NotEmpty().Matches(@"^([01]\d|2[0-3]):[0-5]\d$").WithMessage("StartHour must be in HH:mm 24-hour format.");
        RuleFor(x => x.EndHour).NotEmpty().Matches(@"^([01]\d|2[0-3]):[0-5]\d$").WithMessage("EndHour must be in HH:mm 24-hour format.");
        RuleFor(x => x)
            .Must(x => string.Compare(x.StartHour, x.EndHour, StringComparison.Ordinal) < 0)
            .WithMessage("StartHour must be earlier than EndHour.");
    }
}

public class CreateInterventionTypeDtoValidator : AbstractValidator<CreateInterventionTypeDto>
{
    public CreateInterventionTypeDtoValidator()
    {
        RuleFor(x => x.SpecialtyId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Code).MaximumLength(50);
        RuleFor(x => x.DurationMinutes).GreaterThan(0).WithMessage("Duration in minutes must be greater than 0.");
    }
}

public class UpdateInterventionTypeDtoValidator : AbstractValidator<UpdateInterventionTypeDto>
{
    public UpdateInterventionTypeDtoValidator()
    {
        RuleFor(x => x.SpecialtyId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Code).MaximumLength(50);
        RuleFor(x => x.DurationMinutes).GreaterThan(0).WithMessage("Duration in minutes must be greater than 0.");
    }
}
