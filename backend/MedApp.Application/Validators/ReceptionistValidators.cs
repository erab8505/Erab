using FluentValidation;
using MedApp.Application.DTOs;

namespace MedApp.Application.Validators;

public class CreateReceptionistValidator : AbstractValidator<CreateReceptionistDto>
{
    public CreateReceptionistValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Los nombres son obligatorios.")
            .MaximumLength(100).WithMessage("Los nombres no pueden exceder 100 caracteres.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Los apellidos son obligatorios.")
            .MaximumLength(100).WithMessage("Los apellidos no pueden exceder 100 caracteres.");

        RuleFor(x => x.IdentificationNumber)
            .MaximumLength(50).WithMessage("El número de identificación no puede exceder 50 caracteres.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.")
            .MaximumLength(150).WithMessage("El correo electrónico no puede exceder 150 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Phone)
            .MaximumLength(30).WithMessage("El teléfono no puede exceder 30 caracteres.");
    }
}

public class UpdateReceptionistValidator : AbstractValidator<UpdateReceptionistDto>
{
    public UpdateReceptionistValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Los nombres son obligatorios.")
            .MaximumLength(100).WithMessage("Los nombres no pueden exceder 100 caracteres.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Los apellidos son obligatorios.")
            .MaximumLength(100).WithMessage("Los apellidos no pueden exceder 100 caracteres.");

        RuleFor(x => x.IdentificationNumber)
            .MaximumLength(50).WithMessage("El número de identificación no puede exceder 50 caracteres.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.")
            .MaximumLength(150).WithMessage("El correo electrónico no puede exceder 150 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Phone)
            .MaximumLength(30).WithMessage("El teléfono no puede exceder 30 caracteres.");
    }
}
