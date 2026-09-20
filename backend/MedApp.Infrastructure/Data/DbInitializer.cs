using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedApp.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(MedAppDbContext context, ILogger logger)
    {
        try
        {
            if (context.Database.IsRelational())
            {
                await context.Database.MigrateAsync();
            }
            else
            {
                await context.Database.EnsureCreatedAsync();
            }

            // Seed default company if none exists
            var company = await context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync();
            if (company == null)
            {
                company = new Company
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Name = "Clínica Central Demo",
                    TaxId = "TAX-12345678-9",
                    Address = "Av. Principal 123, Ciudad Médica",
                    Phone = "+1 555-0199",
                    Email = "contacto@clinicacentral.demo",
                    IsActive = true,
                    Description = "Sede central de atención integral",
                    CreatedAt = DateTimeOffset.UtcNow
                };

                await context.Companies.AddAsync(company);
                await context.SaveChangesAsync();
                logger.LogInformation("Default company seeded: {CompanyName}", company.Name);
            }

            // Seed default admin user if none exists
            var adminUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Username == "admin");
            if (adminUser == null)
            {
                adminUser = new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Role = UserRole.Admin,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();

                // Link admin to the company
                await context.UserCompanies.AddAsync(new UserCompany
                {
                    UserId = adminUser.Id,
                    CompanyId = company.Id
                });
                await context.SaveChangesAsync();

                logger.LogInformation("Default admin user seeded (username: admin)");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing and seeding the database.");
            throw;
        }
    }
}
