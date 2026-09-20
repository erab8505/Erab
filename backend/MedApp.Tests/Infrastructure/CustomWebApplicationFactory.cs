using MedApp.Application.Common.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using MedApp.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace MedApp.Tests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    public Guid Company1Id { get; } = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public Guid Company2Id { get; } = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    public Guid AdminUserId { get; } = Guid.Parse("11111111-0000-0000-0000-000000000001");
    public Guid ReceptionistUserId { get; } = Guid.Parse("11111111-0000-0000-0000-000000000002");
    public Guid SpecialistUserId { get; } = Guid.Parse("11111111-0000-0000-0000-000000000003");
    public Guid SpecialistProfileId { get; } = Guid.Parse("33333333-0000-0000-0000-000000000001");
    public Guid Patient1Id { get; } = Guid.Parse("44444444-0000-0000-0000-000000000001");
    public Guid Patient2Id { get; } = Guid.Parse("44444444-0000-0000-0000-000000000002");
    public Guid InterventionId { get; } = Guid.Parse("55555555-0000-0000-0000-000000000001");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var efDescriptors = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<MedAppDbContext>) ||
                d.ServiceType == typeof(DbContextOptions) ||
                d.ServiceType == typeof(MedAppDbContext) ||
                d.ServiceType == typeof(IApplicationDbContext) ||
                (d.ServiceType.Namespace != null && d.ServiceType.Namespace.StartsWith("Microsoft.EntityFrameworkCore"))
            ).ToList();

            foreach (var descriptor in efDescriptors)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<MedAppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
                options.ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning));
            });

            services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<MedAppDbContext>());

            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MedAppDbContext>();
            context.Database.EnsureCreated();

            SeedTestData(context);
        });
    }

    private void SeedTestData(MedAppDbContext context)
    {
        // Companies
        var c1 = new Company
        {
            Id = Company1Id,
            Name = "Hospital General Alfa",
            TaxId = "TAX-ALFA-01",
            IsActive = true
        };
        var c2 = new Company
        {
            Id = Company2Id,
            Name = "Clínica Beta",
            TaxId = "TAX-BETA-02",
            IsActive = true
        };
        context.Companies.AddRange(c1, c2);

        // Areas & Specialties in Company 1
        var area1 = new Area
        {
            Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000001"),
            CompanyId = Company1Id,
            Name = "Medicina General"
        };
        context.Areas.Add(area1);

        var spec1 = new Specialty
        {
            Id = Guid.Parse("abababab-0000-0000-0000-000000000001"),
            CompanyId = Company1Id,
            AreaId = area1.Id,
            Name = "Cardiología"
        };
        context.Specialties.Add(spec1);

        // Specialist in Company 1
        var specialistProfile = new Specialist
        {
            Id = SpecialistProfileId,
            CompanyId = Company1Id,
            SpecialtyId = spec1.Id,
            FirstName = "Carlos",
            LastName = "Gómez",
            LicenseNumber = "MED-CARD-9912",
            IsActive = true
        };
        context.Specialists.Add(specialistProfile);

        // Specialist Availability for Monday (Day 1)
        var availability = new SpecialistAvailability
        {
            Id = Guid.NewGuid(),
            SpecialistId = SpecialistProfileId,
            DayOfWeek = 1, // Monday
            StartHour = "08:00",
            EndHour = "12:00"
        };
        context.SpecialistAvailabilities.Add(availability);

        // Intervention Type
        var intervention = new InterventionType
        {
            Id = InterventionId,
            CompanyId = Company1Id,
            SpecialtyId = spec1.Id,
            Name = "Consulta Cardiológica",
            Code = "CPT-99213",
            DurationMinutes = 30,
            IsActive = true
        };
        context.InterventionTypes.Add(intervention);

        // Patient in Company 1
        var patient1 = new Patient
        {
            Id = Patient1Id,
            CompanyId = Company1Id,
            FirstName = "Juan",
            LastName = "Pérez",
            BirthDate = new DateOnly(1985, 5, 15),
            Gender = Gender.M,
            DocumentId = "DOC-12345"
        };

        // Patient in Company 2
        var patient2 = new Patient
        {
            Id = Patient2Id,
            CompanyId = Company2Id,
            FirstName = "María",
            LastName = "López",
            BirthDate = new DateOnly(1992, 10, 20),
            Gender = Gender.F,
            DocumentId = "DOC-99999"
        };
        context.Patients.AddRange(patient1, patient2);

        // Users
        var admin = new User
        {
            Id = AdminUserId,
            Username = "admin_test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("AdminTest123!"),
            Role = UserRole.Admin
        };

        var receptionist = new User
        {
            Id = ReceptionistUserId,
            Username = "receptionist_test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("ReceptTest123!"),
            Role = UserRole.Receptionist
        };
        receptionist.UserCompanies.Add(new UserCompany { UserId = ReceptionistUserId, CompanyId = Company1Id });

        var specialistUser = new User
        {
            Id = SpecialistUserId,
            Username = "specialist_test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SpecTest123!"),
            Role = UserRole.Specialist,
            SpecialistId = SpecialistProfileId
        };
        specialistUser.UserCompanies.Add(new UserCompany { UserId = SpecialistUserId, CompanyId = Company1Id });

        context.Users.AddRange(admin, receptionist, specialistUser);
        context.SaveChanges();
    }
}
