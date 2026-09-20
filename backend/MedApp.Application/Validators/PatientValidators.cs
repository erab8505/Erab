using FluentValidation;
using MedApp.Application.DTOs;

namespace MedApp.Application.Validators;

public class CreatePatientDtoValidator : AbstractValidator<CreatePatientDto>
{
    public CreatePatientDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DocumentId).NotEmpty().MaximumLength(50);
        RuleFor(x => x.BirthDate)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Birth date cannot be in the future.");
        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.Email))
            .MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.BloodType).MaximumLength(20);
    }
}

public class UpdatePatientDtoValidator : AbstractValidator<UpdatePatientDto>
{
    public UpdatePatientDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DocumentId).NotEmpty().MaximumLength(50);
        RuleFor(x => x.BirthDate)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Birth date cannot be in the future.");
        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.Email))
            .MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.BloodType).MaximumLength(20);
    }
}
