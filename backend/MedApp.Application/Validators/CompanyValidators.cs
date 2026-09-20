using FluentValidation;
using MedApp.Application.DTOs;

namespace MedApp.Application.Validators;

public class CreateCompanyDtoValidator : AbstractValidator<CreateCompanyDto>
{
    public CreateCompanyDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TaxId).MaximumLength(50);
        RuleFor(x => x.Address).MaximumLength(500);
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).MaximumLength(200);
    }
}

public class UpdateCompanyDtoValidator : AbstractValidator<UpdateCompanyDto>
{
    public UpdateCompanyDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TaxId).MaximumLength(50);
        RuleFor(x => x.Address).MaximumLength(500);
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).MaximumLength(200);
    }
}
