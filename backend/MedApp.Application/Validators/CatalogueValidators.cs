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
