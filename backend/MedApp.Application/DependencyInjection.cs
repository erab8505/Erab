using FluentValidation;
using MedApp.Application.Interfaces;
using MedApp.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace MedApp.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // FluentValidation: Register all validators in this assembly
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Application Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IAreaService, AreaService>();
        services.AddScoped<ISpecialtyService, SpecialtyService>();
        services.AddScoped<ISpecialistService, SpecialistService>();
        services.AddScoped<ISpecialistAvailabilityService, SpecialistAvailabilityService>();
        services.AddScoped<IInterventionTypeService, InterventionTypeService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<ISchedulingService, SchedulingService>();
        services.AddScoped<IMedicalRecordService, MedicalRecordService>();
        services.AddScoped<IPrescriptionService, PrescriptionService>();

        return services;
    }
}
