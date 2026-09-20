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

            // Seed full Dental Organization
            await SeedDentalOrganizationAsync(context, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing and seeding the database.");
            throw;
        }
    }

    private static async Task SeedDentalOrganizationAsync(MedAppDbContext context, ILogger logger)
    {
        var dentalCompanyId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var dentalCompany = await context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == dentalCompanyId);

        if (dentalCompany == null)
        {
            dentalCompany = new Company
            {
                Id = dentalCompanyId,
                Name = "Clínica Odontológica Sonrisas & Salud",
                TaxId = "NIT-901458923-4",
                Address = "Av. Las Palmas # 45-80, Edificio Royal Dental, Consultorio 501",
                Phone = "+57 604 4448899",
                Email = "contacto@sonrisasysalud.dental",
                IsActive = true,
                Description = "Centro odontológico integral de alta especialidad: odontología general, ortodoncia, endodoncia, periodoncia, cirugía maxilofacial y estética dental.",
                CreatedAt = DateTimeOffset.UtcNow
            };

            await context.Companies.AddAsync(dentalCompany);
            await context.SaveChangesAsync();
            logger.LogInformation("Dental company seeded: {CompanyName}", dentalCompany.Name);
        }

        // Link admin user to Dental company if not already linked
        var adminUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Username == "admin");
        if (adminUser != null)
        {
            var adminLinked = await context.UserCompanies.IgnoreQueryFilters().AnyAsync(uc => uc.UserId == adminUser.Id && uc.CompanyId == dentalCompany.Id);
            if (!adminLinked)
            {
                await context.UserCompanies.AddAsync(new UserCompany
                {
                    UserId = adminUser.Id,
                    CompanyId = dentalCompany.Id
                });
                await context.SaveChangesAsync();
            }
        }

        // 1. Áreas funcionales
        var areaGeneralId = Guid.Parse("d0000001-0000-0000-0000-000000000001");
        var areaEspecialidadesId = Guid.Parse("d0000001-0000-0000-0000-000000000002");
        var areaCirugiaEsteticaId = Guid.Parse("d0000001-0000-0000-0000-000000000003");

        if (!await context.Areas.IgnoreQueryFilters().AnyAsync(a => a.CompanyId == dentalCompanyId))
        {
            var areas = new List<Area>
            {
                new Area
                {
                    Id = areaGeneralId,
                    CompanyId = dentalCompanyId,
                    Name = "Odontología General y Prevención",
                    Description = "Atención primaria dental, limpiezas profilácticas y odontopediatría.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Area
                {
                    Id = areaEspecialidadesId,
                    CompanyId = dentalCompanyId,
                    Name = "Especialidades Odontológicas",
                    Description = "Tratamientos de ortodoncia, endodoncia avanzada y periodoncia.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Area
                {
                    Id = areaCirugiaEsteticaId,
                    CompanyId = dentalCompanyId,
                    Name = "Cirugía y Estética Dental",
                    Description = "Cirugía maxilofacial, implantes oseointegrados y rehabilitación oral estética.",
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            await context.Areas.AddRangeAsync(areas);
            await context.SaveChangesAsync();
            logger.LogInformation("Dental areas seeded.");
        }

        // 2. Especialidades
        var specOdonGenId = Guid.Parse("d0000002-0000-0000-0000-000000000001");
        var specOdontoPedId = Guid.Parse("d0000002-0000-0000-0000-000000000002");
        var specOrtodonciaId = Guid.Parse("d0000002-0000-0000-0000-000000000003");
        var specEndodonciaId = Guid.Parse("d0000002-0000-0000-0000-000000000004");
        var specPeriodonciaId = Guid.Parse("d0000002-0000-0000-0000-000000000005");
        var specCirugiaOralId = Guid.Parse("d0000002-0000-0000-0000-000000000006");
        var specRehabilitacionId = Guid.Parse("d0000002-0000-0000-0000-000000000007");

        if (!await context.Specialties.IgnoreQueryFilters().AnyAsync(s => s.CompanyId == dentalCompanyId))
        {
            var specialties = new List<Specialty>
            {
                new Specialty
                {
                    Id = specOdonGenId,
                    CompanyId = dentalCompanyId,
                    AreaId = areaGeneralId,
                    Name = "Odontología General",
                    Description = "Prevención, diagnóstico y tratamiento de problemas dentales comunes.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialty
                {
                    Id = specOdontoPedId,
                    CompanyId = dentalCompanyId,
                    AreaId = areaGeneralId,
                    Name = "Odontopediatría",
                    Description = "Cuidado dental integral y preventivo para bebés, niños y adolescentes.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialty
                {
                    Id = specOrtodonciaId,
                    CompanyId = dentalCompanyId,
                    AreaId = areaEspecialidadesId,
                    Name = "Ortodoncia y Ortopedia Maxilar",
                    Description = "Corrección de malposiciones dentarias y alteraciones esqueléticas maxilofaciales.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialty
                {
                    Id = specEndodonciaId,
                    CompanyId = dentalCompanyId,
                    AreaId = areaEspecialidadesId,
                    Name = "Endodoncia",
                    Description = "Diagnóstico y tratamiento de patologías de la pulpa dental y conductos radiculares.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialty
                {
                    Id = specPeriodonciaId,
                    CompanyId = dentalCompanyId,
                    AreaId = areaEspecialidadesId,
                    Name = "Periodoncia e Implantología",
                    Description = "Tratamiento de enfermedades de las encías y soporte óseo dental.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialty
                {
                    Id = specCirugiaOralId,
                    CompanyId = dentalCompanyId,
                    AreaId = areaCirugiaEsteticaId,
                    Name = "Cirugía Oral y Maxilofacial",
                    Description = "Extracciones complejas, cordales retenidas y cirugía correctiva bucal.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialty
                {
                    Id = specRehabilitacionId,
                    CompanyId = dentalCompanyId,
                    AreaId = areaCirugiaEsteticaId,
                    Name = "Rehabilitación Oral y Estética",
                    Description = "Diseño de sonrisa, carillas, coronas de alta estética y prótesis sobre implantes.",
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            await context.Specialties.AddRangeAsync(specialties);
            await context.SaveChangesAsync();
            logger.LogInformation("Dental specialties seeded.");
        }

        // 3. Tipos de Intervención
        var intLimpiezaId = Guid.Parse("d0000003-0000-0000-0000-000000000001");
        var intResinaId = Guid.Parse("d0000003-0000-0000-0000-000000000002");
        var intBlanqueamientoId = Guid.Parse("d0000003-0000-0000-0000-000000000003");
        var intSellantesId = Guid.Parse("d0000003-0000-0000-0000-000000000004");
        var intOrtodonciaCtrlId = Guid.Parse("d0000003-0000-0000-0000-000000000005");
        var intEndoUniId = Guid.Parse("d0000003-0000-0000-0000-000000000006");
        var intEndoMultiId = Guid.Parse("d0000003-0000-0000-0000-000000000007");
        var intCordalesId = Guid.Parse("d0000003-0000-0000-0000-000000000008");
        var intCarillasId = Guid.Parse("d0000003-0000-0000-0000-000000000009");
        var intImplanteId = Guid.Parse("d0000003-0000-0000-0000-000000000010");

        if (!await context.InterventionTypes.IgnoreQueryFilters().AnyAsync(i => i.CompanyId == dentalCompanyId))
        {
            var interventions = new List<InterventionType>
            {
                new InterventionType
                {
                    Id = intLimpiezaId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specOdonGenId,
                    Name = "Limpieza y Profilaxis Ultrasónica",
                    Code = "ODON-01",
                    Description = "Eliminación de placa bacteriana y sarro con ultrasonido + pulido dental.",
                    DurationMinutes = 30,
                    RequiresAnesthesia = false,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new InterventionType
                {
                    Id = intResinaId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specOdonGenId,
                    Name = "Restauración en Resina Fotocurada",
                    Code = "ODON-02",
                    Description = "Obturación estética directa en composite de alta resistencia.",
                    DurationMinutes = 45,
                    RequiresAnesthesia = false,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new InterventionType
                {
                    Id = intBlanqueamientoId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specOdonGenId,
                    Name = "Blanqueamiento Dental LED",
                    Code = "ODON-03",
                    Description = "Aclaramiento dental en consultorio con peróxido de hidrógeno activado por luz.",
                    DurationMinutes = 60,
                    RequiresAnesthesia = false,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new InterventionType
                {
                    Id = intSellantesId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specOdontoPedId,
                    Name = "Sellantes de Fosas y Fisuras + Flúor",
                    Code = "PED-01",
                    Description = "Protección preventiva contra la caries en molares infantiles.",
                    DurationMinutes = 30,
                    RequiresAnesthesia = false,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new InterventionType
                {
                    Id = intOrtodonciaCtrlId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specOrtodonciaId,
                    Name = "Control Mensual de Ortodoncia",
                    Code = "ORT-01",
                    Description = "Cambio de arcos, ligaduras, activación de torque y seguimiento del plan.",
                    DurationMinutes = 30,
                    RequiresAnesthesia = false,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new InterventionType
                {
                    Id = intEndoUniId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specEndodonciaId,
                    Name = "Endodoncia Unirradicular",
                    Code = "ENDO-01",
                    Description = "Tratamiento de conducto para incisivos o caninos.",
                    DurationMinutes = 60,
                    RequiresAnesthesia = true,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new InterventionType
                {
                    Id = intEndoMultiId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specEndodonciaId,
                    Name = "Endodoncia Multirradicular (Molares)",
                    Code = "ENDO-02",
                    Description = "Tratamiento de conductos mecanizado con localizador apical en molares.",
                    DurationMinutes = 90,
                    RequiresAnesthesia = true,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new InterventionType
                {
                    Id = intCordalesId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specCirugiaOralId,
                    Name = "Cirugía de Cordales (Terceros Molares)",
                    Code = "CIR-01",
                    Description = "Extracción quirúrgica de muelas del juicio impactadas o semi-incluidas.",
                    DurationMinutes = 60,
                    RequiresAnesthesia = true,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new InterventionType
                {
                    Id = intCarillasId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specRehabilitacionId,
                    Name = "Diseño de Sonrisa en Cerámica / Carillas",
                    Code = "REH-01",
                    Description = "Preparación y cementación de lentes de contacto y carillas cerámicas.",
                    DurationMinutes = 90,
                    RequiresAnesthesia = false,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new InterventionType
                {
                    Id = intImplanteId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specPeriodonciaId,
                    Name = "Colocación de Implante Dental de Titanio",
                    Code = "PER-01",
                    Description = "Inserción quirúrgica de fijación de titanio grado médico para reposición dental.",
                    DurationMinutes = 90,
                    RequiresAnesthesia = true,
                    RequiresHospitalization = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            await context.InterventionTypes.AddRangeAsync(interventions);
            await context.SaveChangesAsync();
            logger.LogInformation("Dental intervention types seeded.");
        }

        // 4. Especialistas y Disponibilidad Horaria
        var specProfileCamilaId = Guid.Parse("d0000004-0000-0000-0000-000000000001");
        var specProfileOsorioId = Guid.Parse("d0000004-0000-0000-0000-000000000002");
        var specProfileValentinaId = Guid.Parse("d0000004-0000-0000-0000-000000000003");
        var specProfileFelipeId = Guid.Parse("d0000004-0000-0000-0000-000000000004");
        var specProfileMarianaId = Guid.Parse("d0000004-0000-0000-0000-000000000005");

        if (!await context.Specialists.IgnoreQueryFilters().AnyAsync(s => s.CompanyId == dentalCompanyId))
        {
            var specialists = new List<Specialist>
            {
                new Specialist
                {
                    Id = specProfileCamilaId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specOdonGenId,
                    FirstName = "Camila",
                    LastName = "Restrepo",
                    LicenseNumber = "ODON-COL-45210",
                    Email = "camila.restrepo@sonrisasysalud.dental",
                    Phone = "+57 310 555 1101",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialist
                {
                    Id = specProfileOsorioId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specOrtodonciaId,
                    FirstName = "Juan David",
                    LastName = "Osorio",
                    LicenseNumber = "ODON-ORT-88341",
                    Email = "juan.osorio@sonrisasysalud.dental",
                    Phone = "+57 311 555 2202",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialist
                {
                    Id = specProfileValentinaId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specEndodonciaId,
                    FirstName = "Valentina",
                    LastName = "Moreno",
                    LicenseNumber = "ODON-END-19402",
                    Email = "valentina.moreno@sonrisasysalud.dental",
                    Phone = "+57 312 555 3303",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialist
                {
                    Id = specProfileFelipeId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specCirugiaOralId,
                    FirstName = "Felipe",
                    LastName = "Echavarría",
                    LicenseNumber = "ODON-CIR-66512",
                    Email = "felipe.echavarria@sonrisasysalud.dental",
                    Phone = "+57 313 555 4404",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Specialist
                {
                    Id = specProfileMarianaId,
                    CompanyId = dentalCompanyId,
                    SpecialtyId = specRehabilitacionId,
                    FirstName = "Mariana",
                    LastName = "Zuluaga",
                    LicenseNumber = "ODON-REH-77890",
                    Email = "mariana.zuluaga@sonrisasysalud.dental",
                    Phone = "+57 314 555 5505",
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            await context.Specialists.AddRangeAsync(specialists);
            await context.SaveChangesAsync();

            // Disponibilidad horaria
            var availabilities = new List<SpecialistAvailability>();
            // Dra. Camila: Lunes a Viernes 08:00 - 17:00
            for (int day = 1; day <= 5; day++)
            {
                availabilities.Add(new SpecialistAvailability
                {
                    Id = Guid.NewGuid(),
                    SpecialistId = specProfileCamilaId,
                    DayOfWeek = day,
                    StartHour = "08:00",
                    EndHour = "17:00",
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
            // Dr. Osorio: Lunes, Miércoles, Viernes 09:00 - 18:00
            foreach (var day in new[] { 1, 3, 5 })
            {
                availabilities.Add(new SpecialistAvailability
                {
                    Id = Guid.NewGuid(),
                    SpecialistId = specProfileOsorioId,
                    DayOfWeek = day,
                    StartHour = "09:00",
                    EndHour = "18:00",
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
            // Dra. Valentina: Martes, Jueves 08:00 - 16:00, Sábado 08:00 - 13:00
            availabilities.Add(new SpecialistAvailability { Id = Guid.NewGuid(), SpecialistId = specProfileValentinaId, DayOfWeek = 2, StartHour = "08:00", EndHour = "16:00", CreatedAt = DateTimeOffset.UtcNow });
            availabilities.Add(new SpecialistAvailability { Id = Guid.NewGuid(), SpecialistId = specProfileValentinaId, DayOfWeek = 4, StartHour = "08:00", EndHour = "16:00", CreatedAt = DateTimeOffset.UtcNow });
            availabilities.Add(new SpecialistAvailability { Id = Guid.NewGuid(), SpecialistId = specProfileValentinaId, DayOfWeek = 6, StartHour = "08:00", EndHour = "13:00", CreatedAt = DateTimeOffset.UtcNow });

            // Dr. Felipe: Martes y Jueves 08:00 - 17:00
            availabilities.Add(new SpecialistAvailability { Id = Guid.NewGuid(), SpecialistId = specProfileFelipeId, DayOfWeek = 2, StartHour = "08:00", EndHour = "17:00", CreatedAt = DateTimeOffset.UtcNow });
            availabilities.Add(new SpecialistAvailability { Id = Guid.NewGuid(), SpecialistId = specProfileFelipeId, DayOfWeek = 4, StartHour = "08:00", EndHour = "17:00", CreatedAt = DateTimeOffset.UtcNow });

            // Dra. Mariana: Lunes a Jueves 09:00 - 17:00
            for (int day = 1; day <= 4; day++)
            {
                availabilities.Add(new SpecialistAvailability
                {
                    Id = Guid.NewGuid(),
                    SpecialistId = specProfileMarianaId,
                    DayOfWeek = day,
                    StartHour = "09:00",
                    EndHour = "17:00",
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }

            await context.SpecialistAvailabilities.AddRangeAsync(availabilities);
            await context.SaveChangesAsync();
            logger.LogInformation("Dental specialists and availabilities seeded.");
        }

        // 5. Usuarios Odontológicos
        var userRecepDentalId = Guid.Parse("d0000005-0000-0000-0000-000000000001");
        var userCamilaId = Guid.Parse("d0000005-0000-0000-0000-000000000002");
        var userOsorioId = Guid.Parse("d0000005-0000-0000-0000-000000000003");
        var userValentinaId = Guid.Parse("d0000005-0000-0000-0000-000000000004");
        var userFelipeId = Guid.Parse("d0000005-0000-0000-0000-000000000005");

        if (!await context.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == "recepcion_dental"))
        {
            var dentalUsers = new List<User>
            {
                new User
                {
                    Id = userRecepDentalId,
                    Username = "recepcion_dental",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("recep123"),
                    Role = UserRole.Receptionist,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = userCamilaId,
                    Username = "dra_camila",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("camila123"),
                    Role = UserRole.Specialist,
                    SpecialistId = specProfileCamilaId,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = userOsorioId,
                    Username = "dr_osorio",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("osorio123"),
                    Role = UserRole.Specialist,
                    SpecialistId = specProfileOsorioId,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = userValentinaId,
                    Username = "dra_valentina",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("valentina123"),
                    Role = UserRole.Specialist,
                    SpecialistId = specProfileValentinaId,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = userFelipeId,
                    Username = "dr_felipe",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("felipe123"),
                    Role = UserRole.Specialist,
                    SpecialistId = specProfileFelipeId,
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            await context.Users.AddRangeAsync(dentalUsers);
            await context.SaveChangesAsync();

            var userCompanies = new List<UserCompany>
            {
                new UserCompany { UserId = userRecepDentalId, CompanyId = dentalCompanyId },
                new UserCompany { UserId = userCamilaId, CompanyId = dentalCompanyId },
                new UserCompany { UserId = userOsorioId, CompanyId = dentalCompanyId },
                new UserCompany { UserId = userValentinaId, CompanyId = dentalCompanyId },
                new UserCompany { UserId = userFelipeId, CompanyId = dentalCompanyId }
            };

            await context.UserCompanies.AddRangeAsync(userCompanies);
            await context.SaveChangesAsync();
            logger.LogInformation("Dental users seeded.");
        }
        else
        {
            // Ensure dr_felipe exists even if users were previously seeded
            var existingFelipe = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Username == "dr_felipe");
            if (existingFelipe == null)
            {
                var felipeUser = new User
                {
                    Id = userFelipeId,
                    Username = "dr_felipe",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("felipe123"),
                    Role = UserRole.Specialist,
                    SpecialistId = specProfileFelipeId,
                    CreatedAt = DateTimeOffset.UtcNow
                };
                await context.Users.AddAsync(felipeUser);
                await context.SaveChangesAsync();

                var linked = await context.UserCompanies.IgnoreQueryFilters().AnyAsync(uc => uc.UserId == felipeUser.Id && uc.CompanyId == dentalCompanyId);
                if (!linked)
                {
                    await context.UserCompanies.AddAsync(new UserCompany
                    {
                        UserId = felipeUser.Id,
                        CompanyId = dentalCompanyId
                    });
                    await context.SaveChangesAsync();
                }
                logger.LogInformation("Dr. Felipe Echavarria user created and linked.");
            }
        }

        // 6. Pacientes Odontológicos
        var patientMateoId = Guid.Parse("d0000006-0000-0000-0000-000000000001");
        var patientIsabellaId = Guid.Parse("d0000006-0000-0000-0000-000000000002");
        var patientSamuelId = Guid.Parse("d0000006-0000-0000-0000-000000000003");
        var patientLuciaId = Guid.Parse("d0000006-0000-0000-0000-000000000004");

        if (!await context.Patients.IgnoreQueryFilters().AnyAsync(p => p.CompanyId == dentalCompanyId))
        {
            var patients = new List<Patient>
            {
                new Patient
                {
                    Id = patientMateoId,
                    CompanyId = dentalCompanyId,
                    FirstName = "Mateo",
                    LastName = "Arango",
                    BirthDate = new DateOnly(1995, 3, 12),
                    Gender = Gender.M,
                    DocumentId = "CC-1020304050",
                    Email = "mateo.arango@email.com",
                    Phone = "+57 300 123 4567",
                    BloodType = "O+",
                    Allergies = "Ninguna conocida",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Patient
                {
                    Id = patientIsabellaId,
                    CompanyId = dentalCompanyId,
                    FirstName = "Isabella",
                    LastName = "Quintero",
                    BirthDate = new DateOnly(2000, 7, 24),
                    Gender = Gender.F,
                    DocumentId = "CC-1030405060",
                    Email = "isabella.quintero@email.com",
                    Phone = "+57 301 987 6543",
                    BloodType = "A+",
                    Allergies = "Alergia a Penicilina y derivados beta-lactámicos",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Patient
                {
                    Id = patientSamuelId,
                    CompanyId = dentalCompanyId,
                    FirstName = "Samuel",
                    LastName = "Duque",
                    BirthDate = new DateOnly(2014, 11, 5),
                    Gender = Gender.M,
                    DocumentId = "TI-1100223344",
                    Email = "padres.samuel@email.com",
                    Phone = "+57 302 456 7890",
                    BloodType = "O+",
                    Allergies = "Ninguna",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Patient
                {
                    Id = patientLuciaId,
                    CompanyId = dentalCompanyId,
                    FirstName = "Lucía",
                    LastName = "Cardona",
                    BirthDate = new DateOnly(1982, 9, 18),
                    Gender = Gender.F,
                    DocumentId = "CC-43567890",
                    Email = "lucia.cardona@email.com",
                    Phone = "+57 303 654 3210",
                    BloodType = "B+",
                    Allergies = "Alergia a Látex",
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            await context.Patients.AddRangeAsync(patients);
            await context.SaveChangesAsync();
            logger.LogInformation("Dental patients seeded.");
        }

        // 7. Citas Odontológicas (Schedulings)
        var now = DateTimeOffset.UtcNow;
        if (!await context.Schedulings.IgnoreQueryFilters().AnyAsync(s => s.CompanyId == dentalCompanyId))
        {
            var schedulings = new List<Scheduling>
            {
                new Scheduling
                {
                    Id = Guid.NewGuid(),
                    CompanyId = dentalCompanyId,
                    PatientId = patientMateoId,
                    SpecialistId = specProfileFelipeId,
                    InterventionTypeId = intCordalesId,
                    ScheduledAt = now.AddDays(1).Date.AddHours(9),
                    DurationMinutes = 60,
                    Notes = "Extracción quirúrgica de cordales 38 y 48 retenidas",
                    Status = AppointmentStatus.Confirmed,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Scheduling
                {
                    Id = Guid.NewGuid(),
                    CompanyId = dentalCompanyId,
                    PatientId = patientLuciaId,
                    SpecialistId = specProfileFelipeId,
                    InterventionTypeId = intCordalesId,
                    ScheduledAt = now.Date.AddHours(14),
                    DurationMinutes = 60,
                    Notes = "Valoración y extracción programada de cordal superior 18",
                    Status = AppointmentStatus.Scheduled,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Scheduling
                {
                    Id = Guid.NewGuid(),
                    CompanyId = dentalCompanyId,
                    PatientId = patientMateoId,
                    SpecialistId = specProfileOsorioId,
                    InterventionTypeId = intOrtodonciaCtrlId,
                    ScheduledAt = now.AddDays(1).Date.AddHours(10),
                    DurationMinutes = 30,
                    Notes = "Control mensual #5 - Cambio de arcos superiores",
                    Status = AppointmentStatus.Scheduled,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Scheduling
                {
                    Id = Guid.NewGuid(),
                    CompanyId = dentalCompanyId,
                    PatientId = patientIsabellaId,
                    SpecialistId = specProfileValentinaId,
                    InterventionTypeId = intEndoMultiId,
                    ScheduledAt = now.AddDays(2).Date.AddHours(9),
                    DurationMinutes = 90,
                    Notes = "Segunda sesión de endodoncia molar 26 - Obturación de conductos",
                    Status = AppointmentStatus.Confirmed,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Scheduling
                {
                    Id = Guid.NewGuid(),
                    CompanyId = dentalCompanyId,
                    PatientId = patientLuciaId,
                    SpecialistId = specProfileCamilaId,
                    InterventionTypeId = intLimpiezaId,
                    ScheduledAt = now.AddDays(-3).Date.AddHours(14),
                    DurationMinutes = 30,
                    Notes = "Profilaxis preventiva y chequeo anual",
                    Status = AppointmentStatus.Completed,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new Scheduling
                {
                    Id = Guid.NewGuid(),
                    CompanyId = dentalCompanyId,
                    PatientId = patientSamuelId,
                    SpecialistId = specProfileCamilaId,
                    InterventionTypeId = intSellantesId,
                    ScheduledAt = now.AddDays(-5).Date.AddHours(11),
                    DurationMinutes = 30,
                    Notes = "Aplicación de sellantes en molares 16 y 26",
                    Status = AppointmentStatus.Completed,
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            await context.Schedulings.AddRangeAsync(schedulings);
            await context.SaveChangesAsync();
            logger.LogInformation("Dental schedulings seeded.");
        }
        else
        {
            // Ensure Dr. Felipe has schedulings if none exist for him
            var felipeHasSchedulings = await context.Schedulings.IgnoreQueryFilters().AnyAsync(s => s.CompanyId == dentalCompanyId && s.SpecialistId == specProfileFelipeId);
            if (!felipeHasSchedulings)
            {
                var felipeSchedulings = new List<Scheduling>
                {
                    new Scheduling
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = dentalCompanyId,
                        PatientId = patientMateoId,
                        SpecialistId = specProfileFelipeId,
                        InterventionTypeId = intCordalesId,
                        ScheduledAt = now.AddDays(1).Date.AddHours(9),
                        DurationMinutes = 60,
                        Notes = "Extracción quirúrgica de cordales 38 y 48 retenidas",
                        Status = AppointmentStatus.Confirmed,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new Scheduling
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = dentalCompanyId,
                        PatientId = patientLuciaId,
                        SpecialistId = specProfileFelipeId,
                        InterventionTypeId = intCordalesId,
                        ScheduledAt = now.Date.AddHours(14),
                        DurationMinutes = 60,
                        Notes = "Valoración y extracción programada de cordal superior 18",
                        Status = AppointmentStatus.Scheduled,
                        CreatedAt = DateTimeOffset.UtcNow
                    }
                };
                await context.Schedulings.AddRangeAsync(felipeSchedulings);
                await context.SaveChangesAsync();
                logger.LogInformation("Dr. Felipe Echavarria schedulings seeded.");
            }
        }

        // 8. Historias Clínicas y Prescripciones Odontológicas
        if (!await context.MedicalRecords.IgnoreQueryFilters().AnyAsync(m => m.CompanyId == dentalCompanyId))
        {
            var recordLuciaId = Guid.NewGuid();
            var recordLucia = new MedicalRecord
            {
                Id = recordLuciaId,
                CompanyId = dentalCompanyId,
                PatientId = patientLuciaId,
                InterventionTypeId = intLimpiezaId,
                RecordDate = DateTimeOffset.UtcNow.AddDays(-3),
                Diagnosis = "Gingivitis marginal generalizada asociada a biofilm dental. Caries oclusal incipiente en pieza 46.",
                Treatment = "Detartraje ultrasónico supragingival y pulido profiláctico. Restauración estética con resina nanohíbrida pieza 46.",
                Notes = "Paciente con buena evolución. Se instruye en técnica de cepillado Bass modificada y uso de hilo dental.",
                SystolicBP = 118,
                DiastolicBP = 76,
                HeartRateBpm = 72,
                OxygenSaturation = 98,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var recordIsabellaId = Guid.NewGuid();
            var recordIsabella = new MedicalRecord
            {
                Id = recordIsabellaId,
                CompanyId = dentalCompanyId,
                PatientId = patientIsabellaId,
                InterventionTypeId = intEndoMultiId,
                RecordDate = DateTimeOffset.UtcNow.AddDays(-7),
                Diagnosis = "Pulpitis irreversible sintomática en pieza 26 con dolor punzante a estímulos térmicos y percusión positiva.",
                Treatment = "Apertura cameral, aislamiento absoluto, instrumentación rotatoria mecanizada de 3 conductos (MV, DV, P) y medicación intraconducto.",
                Notes = "Paciente alérgica a Penicilina. Se formula analgesia y antibiótico alternativo no betalactámico.",
                SystolicBP = 115,
                DiastolicBP = 75,
                HeartRateBpm = 78,
                OxygenSaturation = 99,
                CreatedAt = DateTimeOffset.UtcNow
            };

            await context.MedicalRecords.AddRangeAsync(recordLucia, recordIsabella);
            await context.SaveChangesAsync();

            // Prescripciones
            var prescLucia = new Prescription
            {
                Id = Guid.NewGuid(),
                CompanyId = dentalCompanyId,
                PatientId = patientLuciaId,
                SpecialistId = specProfileCamilaId,
                MedicalRecordId = recordLuciaId,
                PrescriptionDate = DateTimeOffset.UtcNow.AddDays(-3),
                Notes = "Cuidado post-limpieza y control de placa bacteriana",
                CreatedAt = DateTimeOffset.UtcNow
            };

            var prescIsabella = new Prescription
            {
                Id = Guid.NewGuid(),
                CompanyId = dentalCompanyId,
                PatientId = patientIsabellaId,
                SpecialistId = specProfileValentinaId,
                MedicalRecordId = recordIsabellaId,
                PrescriptionDate = DateTimeOffset.UtcNow.AddDays(-7),
                Notes = "Manejo de dolor agudo e inflamación periapical (Paciente alérgica a penicilina)",
                CreatedAt = DateTimeOffset.UtcNow
            };

            await context.Prescriptions.AddRangeAsync(prescLucia, prescIsabella);
            await context.SaveChangesAsync();

            var items = new List<PrescriptionItem>
            {
                new PrescriptionItem
                {
                    Id = Guid.NewGuid(),
                    PrescriptionId = prescLucia.Id,
                    MedicationName = "Clorhexidina Solución Bucal 0.12%",
                    Dosage = "15 ml",
                    Frequency = "Cada 12 horas después del cepillado",
                    DurationDays = 7,
                    Instructions = "Enjuagar durante 1 minuto sin tragar. No comer ni beber en los siguientes 30 minutos.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new PrescriptionItem
                {
                    Id = Guid.NewGuid(),
                    PrescriptionId = prescLucia.Id,
                    MedicationName = "Ibuprofeno 400 mg",
                    Dosage = "1 tableta",
                    Frequency = "Cada 8 horas si hay molestia",
                    DurationDays = 3,
                    Instructions = "Tomar con las comidas principales.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new PrescriptionItem
                {
                    Id = Guid.NewGuid(),
                    PrescriptionId = prescIsabella.Id,
                    MedicationName = "Clindamicina 300 mg",
                    Dosage = "1 cápsula",
                    Frequency = "Cada 8 horas",
                    DurationDays = 7,
                    Instructions = "Tomar con abundante agua. Completar los 7 días de tratamiento antibiótico.",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new PrescriptionItem
                {
                    Id = Guid.NewGuid(),
                    PrescriptionId = prescIsabella.Id,
                    MedicationName = "Ketorolaco Trometamina 10 mg Sublingual",
                    Dosage = "1 tableta sublingual",
                    Frequency = "Cada 8 horas en caso de dolor moderado a severo",
                    DurationDays = 3,
                    Instructions = "Disolver debajo de la lengua sin masticar. Máximo 4 días.",
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            await context.PrescriptionItems.AddRangeAsync(items);
            await context.SaveChangesAsync();
            logger.LogInformation("Dental medical records and prescriptions seeded.");
        }
    }
}
