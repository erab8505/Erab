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
    public Guid CompanyAdminUserId { get; } = Guid.Parse("11111111-0000-0000-0000-000000000005");
    public Guid ReceptionistUserId { get; } = Guid.Parse("11111111-0000-0000-0000-000000000002");
    public Guid SpecialistUserId { get; } = Guid.Parse("11111111-0000-0000-0000-000000000003");
    public Guid SpecialistProfileId { get; } = Guid.Parse("33333333-0000-0000-0000-000000000001");
    public Guid Specialist2UserId { get; } = Guid.Parse("11111111-0000-0000-0000-000000000004");
    public Guid Specialist2ProfileId { get; } = Guid.Parse("33333333-0000-0000-0000-000000000002");
    public Guid Specialist1SchedulingId { get; } = Guid.Parse("66666666-0000-0000-0000-000000000001");
    public Guid Specialist2SchedulingId { get; } = Guid.Parse("66666666-0000-0000-0000-000000000002");
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

        // Employee 1 (Specialist) in Company 1
        var employee1 = new Employee
        {
            Id = SpecialistProfileId,
            CompanyId = Company1Id,
            SpecialtyId = spec1.Id,
            FirstName = "Carlos",
            LastName = "Gómez",
            LicenseNumber = "MED-CARD-9912",
            JobTitle = "Cardiólogo",
            IsActive = true
        };

        // Employee 2 (Specialist) in Company 1
        var employee2 = new Employee
        {
            Id = Specialist2ProfileId,
            CompanyId = Company1Id,
            SpecialtyId = spec1.Id,
            FirstName = "Ana",
            LastName = "Martínez",
            LicenseNumber = "MED-CARD-8833",
            JobTitle = "Cardióloga",
            IsActive = true
        };
        context.Employees.AddRange(employee1, employee2);

        // Employee Availabilities for Monday (Day 1)
        var availability1 = new EmployeeAvailability
        {
            Id = Guid.NewGuid(),
            EmployeeId = SpecialistProfileId,
            DayOfWeek = 1, // Monday
            StartHour = "08:00",
            EndHour = "12:00"
        };
        var availability2 = new EmployeeAvailability
        {
            Id = Guid.NewGuid(),
            EmployeeId = Specialist2ProfileId,
            DayOfWeek = 1, // Monday
            StartHour = "13:00",
            EndHour = "17:00"
        };
        context.EmployeeAvailabilities.AddRange(availability1, availability2);

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

        // Schedulings (Appointments)
        var scheduling1 = new Scheduling
        {
            Id = Specialist1SchedulingId,
            CompanyId = Company1Id,
            PatientId = Patient1Id,
            EmployeeId = SpecialistProfileId,
            InterventionTypeId = InterventionId,
            ScheduledAt = DateTimeOffset.UtcNow.AddDays(1),
            DurationMinutes = 30,
            Status = AppointmentStatus.Scheduled,
            Notes = "Cita con Especialista 1"
        };
        var scheduling2 = new Scheduling
        {
            Id = Specialist2SchedulingId,
            CompanyId = Company1Id,
            PatientId = Patient1Id,
            EmployeeId = Specialist2ProfileId,
            InterventionTypeId = InterventionId,
            ScheduledAt = DateTimeOffset.UtcNow.AddDays(2),
            DurationMinutes = 30,
            Status = AppointmentStatus.Scheduled,
            Notes = "Cita con Especialista 2"
        };
        context.Schedulings.AddRange(scheduling1, scheduling2);

        // Users
        var admin = new User
        {
            Id = AdminUserId,
            Username = "admin_test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("AdminTest123!"),
            UserRoles = new List<UserRoleAssignment> { new() { Role = UserRole.SuperAdmin } }
        };
        admin.UserCompanies.Add(new UserCompany { UserId = AdminUserId, CompanyId = Company1Id });

        var receptionist = new User
        {
            Id = ReceptionistUserId,
            Username = "receptionist_test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("ReceptTest123!"),
            UserRoles = new List<UserRoleAssignment> { new() { Role = UserRole.Receptionist } }
        };
        receptionist.UserCompanies.Add(new UserCompany { UserId = ReceptionistUserId, CompanyId = Company1Id });

        var specialistUser1 = new User
        {
            Id = SpecialistUserId,
            Username = "specialist_test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SpecTest123!"),
            EmployeeId = SpecialistProfileId,
            UserRoles = new List<UserRoleAssignment> { new() { Role = UserRole.Specialist } }
        };
        specialistUser1.UserCompanies.Add(new UserCompany { UserId = SpecialistUserId, CompanyId = Company1Id });

        var specialistUser2 = new User
        {
            Id = Specialist2UserId,
            Username = "specialist2_test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Spec2Test123!"),
            EmployeeId = Specialist2ProfileId,
            UserRoles = new List<UserRoleAssignment> { new() { Role = UserRole.Specialist } }
        };

        var companyAdmin = new User
        {
            Id = CompanyAdminUserId,
            Username = "company_admin_test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CompAdmin123!"),
            UserRoles = new List<UserRoleAssignment> { new() { Role = UserRole.Admin } }
        };
        companyAdmin.UserCompanies.Add(new UserCompany { UserId = CompanyAdminUserId, CompanyId = Company1Id });

        var company2User = new User
        {
            Id = Guid.Parse("11111111-0000-0000-0000-000000000006"),
            Username = "company2_user",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Comp2User123!"),
            UserRoles = new List<UserRoleAssignment> { new() { Role = UserRole.Receptionist } }
        };
        company2User.UserCompanies.Add(new UserCompany { UserId = company2User.Id, CompanyId = Company2Id });

        context.Users.AddRange(admin, companyAdmin, receptionist, specialistUser1, specialistUser2, company2User);
        context.SaveChanges();
    }
}
