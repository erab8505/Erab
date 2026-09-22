using FluentValidation;
using MedApp.Application.DTOs;

namespace MedApp.Application.Validators;

public class CreateSchedulingDtoValidator : AbstractValidator<CreateSchedulingDto>
{
    public CreateSchedulingDtoValidator()
    {
        RuleFor(x => x.PatientId).NotEmpty();
        RuleFor(x => x.EmployeeId).NotEmpty();
        RuleFor(x => x.InterventionTypeId).NotEmpty();
        RuleFor(x => x.ScheduledAt)
            .GreaterThan(DateTimeOffset.UtcNow.AddMinutes(-5))
            .WithMessage("Scheduled appointment time must be in the future.");
        RuleFor(x => x.DurationMinutes).GreaterThan(0).WithMessage("Duration must be greater than 0 minutes.");
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}

public class RescheduleDtoValidator : AbstractValidator<RescheduleDto>
{
    public RescheduleDtoValidator()
    {
        RuleFor(x => x.NewScheduledAt)
            .GreaterThan(DateTimeOffset.UtcNow.AddMinutes(-5))
            .WithMessage("Rescheduled appointment time must be in the future.");
        RuleFor(x => x.DurationMinutes).GreaterThan(0).WithMessage("Duration must be greater than 0 minutes.");
    }
}
