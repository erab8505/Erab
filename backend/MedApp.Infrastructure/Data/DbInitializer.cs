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

            // Seed Clinical Studies & Laboratory Module
            await SeedClinicalStudiesAndLabModuleAsync(context, logger);
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

            // Ensure laboratorist user exists
            var existingLabUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Username == "laboratorio_central");
            if (existingLabUser == null)
            {
                var labUser = new User
                {
                    Id = Guid.Parse("d0000005-0000-0000-0000-000000000099"),
                    Username = "laboratorio_central",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("lab123"),
                    Role = UserRole.Laboratorist,
                    CreatedAt = DateTimeOffset.UtcNow
                };
                await context.Users.AddAsync(labUser);
                await context.SaveChangesAsync();

                var linked = await context.UserCompanies.IgnoreQueryFilters().AnyAsync(uc => uc.UserId == labUser.Id && uc.CompanyId == dentalCompanyId);
                if (!linked)
                {
                    await context.UserCompanies.AddAsync(new UserCompany
                    {
                        UserId = labUser.Id,
                        CompanyId = dentalCompanyId
                    });
                    await context.SaveChangesAsync();
                }
                logger.LogInformation("Laboratorist user (laboratorio_central) created and linked.");
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

    private static async Task SeedClinicalStudiesAndLabModuleAsync(MedAppDbContext context, ILogger logger)
    {
        var companies = await context.Companies.IgnoreQueryFilters().ToListAsync();

        foreach (var comp in companies)
        {
            var companyId = comp.Id;

            // 1. Catálogo Maestro de Parámetros / Analitos
            if (!await context.LabParameters.IgnoreQueryFilters().AnyAsync(p => p.CompanyId == companyId))
            {
                var parameters = new List<LabParameter>
                {
                    // Química Sanguínea & Metabolismo
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "GLU", Name = "Glucosa en Ayunas", Unit = "mg/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 70.0m, DefaultReferenceMax = 100.0m, DefaultReferenceText = "Normal: 70 - 100 mg/dL", DefaultReagentName = "Kit Glucosa GOD-PAP", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "HBA1C", Name = "Hemoglobina Glicosilada (HbA1c)", Unit = "%", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 4.0m, DefaultReferenceMax = 5.6m, DefaultReferenceText = "Normal: < 5.7%, Prediabetes: 5.7 - 6.4%, Diabetes: >= 6.5%", DefaultReagentName = "Cartucho HPLC HbA1c", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "BUN", Name = "Urea / Nitrógeno Ureico (BUN)", Unit = "mg/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 7.0m, DefaultReferenceMax = 20.0m, DefaultReferenceText = "Normal: 7 - 20 mg/dL", DefaultReagentName = "Reactivo Ureasa GLDH", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "CREAT", Name = "Creatinina Sérica", Unit = "mg/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 0.6m, DefaultReferenceMax = 1.2m, DefaultReferenceText = "Normal: 0.6 - 1.2 mg/dL", DefaultReagentName = "Reactivo Jaffé Cinético", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "AC-URIC", Name = "Ácido Úrico", Unit = "mg/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 2.5m, DefaultReferenceMax = 7.0m, DefaultReferenceText = "Hombres: 3.5 - 7.2 mg/dL, Mujeres: 2.6 - 6.0 mg/dL", DefaultReagentName = "Reactivo Uricasa-PAP", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },

                    // Perfil Lipídico
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "COL-TOT", Name = "Colesterol Total", Unit = "mg/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 0.0m, DefaultReferenceMax = 200.0m, DefaultReferenceText = "Deseable: < 200 mg/dL, Moderado: 200 - 239 mg/dL", DefaultReagentName = "Kit Colesterol CHOD-PAP", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "TRIG", Name = "Triglicéridos", Unit = "mg/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 0.0m, DefaultReferenceMax = 150.0m, DefaultReferenceText = "Normal: < 150 mg/dL, Límite: 150 - 199 mg/dL", DefaultReagentName = "Kit Triglicéridos GPO-PAP", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "COL-HDL", Name = "Colesterol HDL (Bueno)", Unit = "mg/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 40.0m, DefaultReferenceMax = 60.0m, DefaultReferenceText = "Protector: > 50 mg/dL (mujeres), > 40 mg/dL (hombres)", DefaultReagentName = "Reactivo Directo HDL", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "COL-LDL", Name = "Colesterol LDL (Malo)", Unit = "mg/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 0.0m, DefaultReferenceMax = 100.0m, DefaultReferenceText = "Óptimo: < 100 mg/dL, Límite: 100 - 129 mg/dL", DefaultReagentName = "Reactivo Directo LDL", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "COL-VLDL", Name = "Colesterol VLDL", Unit = "mg/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 2.0m, DefaultReferenceMax = 30.0m, DefaultReferenceText = "Normal: 2.0 - 30.0 mg/dL", DefaultReagentName = "Cálculo Friedewald", DefaultReagentQuantity = 0.0m, CreatedAt = DateTimeOffset.UtcNow },

                    // Biometría Hemática / Hematología
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "HB", Name = "Hemoglobina", Unit = "g/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 12.0m, DefaultReferenceMax = 16.5m, DefaultReferenceText = "Mujeres: 12.0 - 15.5 g/dL, Hombres: 13.5 - 17.5 g/dL", DefaultReagentName = "Reactivo Drabkin", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "HCT", Name = "Hematocrito", Unit = "%", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 36.0m, DefaultReferenceMax = 50.0m, DefaultReferenceText = "Mujeres: 37 - 48%, Hombres: 42 - 52%", DefaultReagentName = "Centrifugación", DefaultReagentQuantity = 0.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "RBC", Name = "Eritrocitos (Glóbulos Rojos)", Unit = "x10^6/uL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 4.0m, DefaultReferenceMax = 5.5m, DefaultReferenceText = "Mujeres: 4.0 - 5.2, Hombres: 4.5 - 5.9 x10^6/uL", DefaultReagentName = "Diluyente Hematológico", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "WBC", Name = "Leucocitos Totales (Glóbulos Blancos)", Unit = "x10^3/uL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 4.5m, DefaultReferenceMax = 11.0m, DefaultReferenceText = "Normal: 4.5 - 11.0 x10^3/uL", DefaultReagentName = "Reactivo Lisante", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "PLT", Name = "Plaquetas", Unit = "x10^3/uL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 150.0m, DefaultReferenceMax = 450.0m, DefaultReferenceText = "Normal: 150 - 450 x10^3/uL", DefaultReagentName = "Reactivo Diluyente", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "VPM", Name = "Volumen Plaquetario Medio (VPM)", Unit = "fL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 7.5m, DefaultReferenceMax = 11.5m, DefaultReferenceText = "Normal: 7.5 - 11.5 fL", DefaultReagentName = "Cálculo Automatizado", DefaultReagentQuantity = 0.0m, CreatedAt = DateTimeOffset.UtcNow },

                    // Urianálisis (EGO)
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "EGO-ASP", Name = "Aspecto de la Orina", Unit = null, ValueType = ParameterValueType.Qualitative, DefaultReferenceMin = null, DefaultReferenceMax = null, DefaultReferenceText = "Límpido / Transparente", DefaultReagentName = "Inspección Visual", DefaultReagentQuantity = 0.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "EGO-COL", Name = "Color de la Orina", Unit = null, ValueType = ParameterValueType.Qualitative, DefaultReferenceMin = null, DefaultReferenceMax = null, DefaultReferenceText = "Amarillo Ámbar / Paja", DefaultReagentName = "Inspección Visual", DefaultReagentQuantity = 0.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "EGO-DEN", Name = "Densidad Urinaria", Unit = null, ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 1.005m, DefaultReferenceMax = 1.030m, DefaultReferenceText = "Normal: 1.005 - 1.030", DefaultReagentName = "Tira Reactiva 10P", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "EGO-PH", Name = "pH Urinario", Unit = null, ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 5.0m, DefaultReferenceMax = 8.0m, DefaultReferenceText = "Normal: 5.0 - 7.5", DefaultReagentName = "Tira Reactiva 10P", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "EGO-PROT", Name = "Proteínas / Albúmina", Unit = null, ValueType = ParameterValueType.Qualitative, DefaultReferenceMin = null, DefaultReferenceMax = null, DefaultReferenceText = "Negativo", DefaultReagentName = "Tira Reactiva 10P", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "EGO-GLU", Name = "Glucosa en Orina", Unit = null, ValueType = ParameterValueType.Qualitative, DefaultReferenceMin = null, DefaultReferenceMax = null, DefaultReferenceText = "Negativo / Normal", DefaultReagentName = "Tira Reactiva 10P", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "EGO-LEUC", Name = "Sedimento: Leucocitos", Unit = "x campo", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 0.0m, DefaultReferenceMax = 5.0m, DefaultReferenceText = "0 - 5 por campo de 40x", DefaultReagentName = "Microscopía Óptica", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "EGO-BACT", Name = "Sedimento: Bacterias", Unit = null, ValueType = ParameterValueType.Qualitative, DefaultReferenceMin = null, DefaultReferenceMax = null, DefaultReferenceText = "Escasas / Ausentes", DefaultReagentName = "Microscopía Óptica", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },

                    // Hormonas Tiroideas
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "TSH", Name = "Hormona Estimulante de Tiroides (TSH)", Unit = "uIU/mL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 0.40m, DefaultReferenceMax = 4.00m, DefaultReferenceText = "Normal: 0.40 - 4.00 uIU/mL", DefaultReagentName = "Kit Quimioluminiscencia TSH", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "T4-LIBRE", Name = "Tiroxina Libre (T4 Libre)", Unit = "ng/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 0.80m, DefaultReferenceMax = 1.80m, DefaultReferenceText = "Normal: 0.80 - 1.80 ng/dL", DefaultReagentName = "Kit Quimioluminiscencia FT4", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow },
                    new LabParameter { Id = Guid.NewGuid(), CompanyId = companyId, Code = "T3-TOT", Name = "Triyodotironina Total (T3 Total)", Unit = "ng/dL", ValueType = ParameterValueType.Numeric, DefaultReferenceMin = 80.0m, DefaultReferenceMax = 200.0m, DefaultReferenceText = "Normal: 80 - 200 ng/dL", DefaultReagentName = "Kit Quimioluminiscencia T3", DefaultReagentQuantity = 1.0m, CreatedAt = DateTimeOffset.UtcNow }
                };

                await context.LabParameters.AddRangeAsync(parameters);
                await context.SaveChangesAsync();
                logger.LogInformation("Lab parameters seeded for company {CompanyId}.", companyId);
            }

            // 2. Catálogo Maestro de Exámenes
            if (!await context.LabExams.IgnoreQueryFilters().AnyAsync(e => e.CompanyId == companyId))
            {
                var paramsDict = await context.LabParameters
                    .IgnoreQueryFilters()
                    .Where(p => p.CompanyId == companyId)
                    .ToDictionaryAsync(p => p.Code, p => p.Id);

                var exams = new List<LabExam>
                {
                    new LabExam
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EX-BH",
                        Name = "Biometría Hemática Completa",
                        Description = "Citometría hemática completa de fórmula roja, serie blanca y recuento plaquetario.",
                        SampleType = SampleType.VenousBlood,
                        Method = "Citometría de Flujo & Impedancia Automatizada",
                        TurnaroundHours = 4,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new LabExam
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EX-QS6",
                        Name = "Química Sanguínea de 6 Elementos",
                        Description = "Evaluación de glucosa, función renal (BUN, creatinina, ácido úrico) y perfil lipídico básico.",
                        SampleType = SampleType.VenousBlood,
                        Method = "Espectrofotometría Automatizada",
                        TurnaroundHours = 6,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new LabExam
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EX-LIPID",
                        Name = "Perfil Lipídico / Perfil de Lípidos",
                        Description = "Fraccionamiento de colesterol total, triglicéridos, HDL, LDL y VLDL para riesgo cardiovascular.",
                        SampleType = SampleType.VenousBlood,
                        Method = "Enzimático Colorimétrico & Directo",
                        TurnaroundHours = 6,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new LabExam
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EX-EGO",
                        Name = "Examen General de Orina (EGO / Urianálisis)",
                        Description = "Análisis físico, químico y microscópico del sedimento urinario.",
                        SampleType = SampleType.Urine,
                        Method = "Físico-Químico por Tira y Microscopía de Sedimento",
                        TurnaroundHours = 2,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new LabExam
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EX-TIROID",
                        Name = "Perfil Tiroideo Básico (TSH, T4L, T3T)",
                        Description = "Evaluación funcional de la glándula tiroides mediante inmunoensayo.",
                        SampleType = SampleType.VenousBlood,
                        Method = "Inmunoensayo por Quimioluminiscencia (CLIA)",
                        TurnaroundHours = 12,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new LabExam
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EX-DIAB-CTRL",
                        Name = "Control Metabólico de Diabetes (Glucosa + HbA1c)",
                        Description = "Monitoreo glicémico agudo y promedio trimestral.",
                        SampleType = SampleType.VenousBlood,
                        Method = "Enzimático & HPLC",
                        TurnaroundHours = 6,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    }
                };

                // Link parameters to exams
                void AddExamParams(LabExam exam, params string[] paramCodes)
                {
                    int order = 0;
                    foreach (var code in paramCodes)
                    {
                        if (paramsDict.TryGetValue(code, out var pId))
                        {
                            exam.Parameters.Add(new LabExamParameter
                            {
                                Id = Guid.NewGuid(),
                                LabExamId = exam.Id,
                                LabParameterId = pId,
                                SortOrder = ++order,
                                CreatedAt = DateTimeOffset.UtcNow
                            });
                        }
                    }
                }

                AddExamParams(exams[0], "HB", "HCT", "RBC", "WBC", "PLT", "VPM");
                AddExamParams(exams[1], "GLU", "BUN", "CREAT", "AC-URIC", "COL-TOT", "TRIG");
                AddExamParams(exams[2], "COL-TOT", "TRIG", "COL-HDL", "COL-LDL", "COL-VLDL");
                AddExamParams(exams[3], "EGO-ASP", "EGO-COL", "EGO-DEN", "EGO-PH", "EGO-PROT", "EGO-GLU", "EGO-LEUC", "EGO-BACT");
                AddExamParams(exams[4], "TSH", "T4-LIBRE", "T3-TOT");
                AddExamParams(exams[5], "GLU", "HBA1C");

                await context.LabExams.AddRangeAsync(exams);
                await context.SaveChangesAsync();
                logger.LogInformation("Lab exams and parameters associations seeded for company {CompanyId}.", companyId);
            }

            // 3. Catálogo de Estudios / Perfiles Comerciales
            if (!await context.ClinicalStudies.IgnoreQueryFilters().AnyAsync(s => s.CompanyId == companyId))
            {
                var examsDict = await context.LabExams
                    .IgnoreQueryFilters()
                    .Where(e => e.CompanyId == companyId)
                    .ToDictionaryAsync(e => e.Code, e => e.Id);

                var studies = new List<ClinicalStudy>
                {
                    new ClinicalStudy
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EST-LIPID",
                        Name = "Perfil Lipídico Integral",
                        Description = "Evaluación completa de colesterol, triglicéridos y fracciones para control cardiovascular.",
                        Category = StudyCategory.Laboratory,
                        BasePrice = 45.00m,
                        PreparationInstructions = "Ayuno estricto de 12 horas. Evitar comidas copiosas o alcohol el día previo.",
                        TurnaroundTimeHours = 6,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new ClinicalStudy
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EST-CHECKUP-BAS",
                        Name = "Check-Up Preventivo Básico",
                        Description = "Paquete de rutina: Biometría Hemática + Química Sanguínea 6 elementos + Examen General de Orina.",
                        Category = StudyCategory.Laboratory,
                        BasePrice = 95.00m,
                        PreparationInstructions = "Ayuno de 8 a 12 horas. Recolectar la primera orina de la mañana en recipiente estéril.",
                        TurnaroundTimeHours = 12,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new ClinicalStudy
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EST-CHECKUP-EXEC",
                        Name = "Check-Up Ejecutivo Integral",
                        Description = "Paquete completo integral: Biometría Hemática, Química Sanguínea, Perfil Lipídico, EGO y Perfil Tiroideo.",
                        Category = StudyCategory.Laboratory,
                        BasePrice = 160.00m,
                        PreparationInstructions = "Ayuno de 12 horas. Primera orina de la mañana.",
                        TurnaroundTimeHours = 24,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new ClinicalStudy
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EST-DIABETES",
                        Name = "Control de Paciente Diabético",
                        Description = "Evaluación glicémica dual (Glucosa en ayunas + HbA1c) y urológica.",
                        Category = StudyCategory.Laboratory,
                        BasePrice = 65.00m,
                        PreparationInstructions = "Ayuno de 8 horas antes de la toma de muestra.",
                        TurnaroundTimeHours = 6,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    },
                    new ClinicalStudy
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        Code = "EST-BH",
                        Name = "Biometría Hemática y Fórmula Roja",
                        Description = "Estudio hematológico completo para descarte de anemias e infecciones.",
                        Category = StudyCategory.Laboratory,
                        BasePrice = 25.00m,
                        PreparationInstructions = "No requiere ayuno prolongado. Hidratación normal.",
                        TurnaroundTimeHours = 4,
                        IsActive = true,
                        CreatedAt = DateTimeOffset.UtcNow
                    }
                };

                void AddStudyExams(ClinicalStudy study, params string[] examCodes)
                {
                    int order = 0;
                    foreach (var code in examCodes)
                    {
                        if (examsDict.TryGetValue(code, out var eId))
                        {
                            study.StudyExams.Add(new ClinicalStudyExam
                            {
                                Id = Guid.NewGuid(),
                                ClinicalStudyId = study.Id,
                                LabExamId = eId,
                                SortOrder = ++order,
                                CreatedAt = DateTimeOffset.UtcNow
                            });
                        }
                    }
                }

                AddStudyExams(studies[0], "EX-LIPID");
                AddStudyExams(studies[1], "EX-BH", "EX-QS6", "EX-EGO");
                AddStudyExams(studies[2], "EX-BH", "EX-QS6", "EX-LIPID", "EX-EGO", "EX-TIROID");
                AddStudyExams(studies[3], "EX-DIAB-CTRL", "EX-EGO");
                AddStudyExams(studies[4], "EX-BH");

                await context.ClinicalStudies.AddRangeAsync(studies);
                await context.SaveChangesAsync();
                logger.LogInformation("Clinical studies and exam associations seeded for company {CompanyId}.", companyId);
            }

            // 4. Órdenes de Ejemplo (StudyOrders con Resultados)
            if (!await context.StudyOrders.IgnoreQueryFilters().AnyAsync(o => o.CompanyId == companyId))
            {
                var patient = await context.Patients.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.CompanyId == companyId);
                var specialist = await context.Specialists.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.CompanyId == companyId);
                var studyCheckup = await context.ClinicalStudies
                    .IgnoreQueryFilters()
                    .Include(s => s.StudyExams)
                        .ThenInclude(se => se.LabExam)
                            .ThenInclude(e => e.Parameters)
                                .ThenInclude(ep => ep.LabParameter)
                    .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.Code == "EST-CHECKUP-BAS");

                var studyLipid = await context.ClinicalStudies
                    .IgnoreQueryFilters()
                    .Include(s => s.StudyExams)
                        .ThenInclude(se => se.LabExam)
                            .ThenInclude(e => e.Parameters)
                                .ThenInclude(ep => ep.LabParameter)
                    .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.Code == "EST-LIPID");

                if (patient != null && studyCheckup != null)
                {
                    // Orden 1: Completada con resultados evaluados (Demostración de alertas)
                    var orderCompleted = new StudyOrder
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        PatientId = patient.Id,
                        SpecialistId = specialist?.Id,
                        OrderNumber = $"LAB-{DateTimeOffset.UtcNow.Year}-00001",
                        Status = StudyOrderStatus.Completed,
                        OrderDate = DateTimeOffset.UtcNow.AddDays(-2),
                        CompletedDate = DateTimeOffset.UtcNow.AddDays(-1),
                        LaboratoristName = "Lic. Carlos Mendoza - QFB / Reg. LAB-4402",
                        ClinicalDiagnosis = "Chequeo médico anual de rutina y control de glicemia.",
                        Notes = "Paciente con leve hiperglicemia e hipercolesterolemia. Se recomienda ajuste nutricional y control en 3 meses.",
                        TotalAmount = studyCheckup.BasePrice
                    };

                    var itemCheckup = new StudyOrderItem
                    {
                        Id = Guid.NewGuid(),
                        StudyOrderId = orderCompleted.Id,
                        ClinicalStudyId = studyCheckup.Id,
                        Price = studyCheckup.BasePrice,
                        Status = StudyOrderStatus.Completed
                    };

                    foreach (var se in studyCheckup.StudyExams.OrderBy(x => x.SortOrder))
                    {
                        foreach (var ep in se.LabExam.Parameters.OrderBy(x => x.SortOrder))
                        {
                            var result = new StudyOrderResult
                            {
                                Id = Guid.NewGuid(),
                                StudyOrderItemId = itemCheckup.Id,
                                LabExamId = se.LabExamId,
                                LabParameterId = ep.LabParameterId,
                                ParameterCode = ep.LabParameter.Code,
                                ParameterName = ep.LabParameter.Name,
                                Unit = ep.LabParameter.Unit,
                                ValueType = ep.LabParameter.ValueType,
                                ReferenceRangeMin = ep.CustomReferenceMin ?? ep.LabParameter.DefaultReferenceMin,
                                ReferenceRangeMax = ep.CustomReferenceMax ?? ep.LabParameter.DefaultReferenceMax,
                                ReferenceText = ep.CustomReferenceText ?? ep.LabParameter.DefaultReferenceText,
                                IsOutOfRange = false,
                                AlertLevel = "Normal"
                            };

                            // Simulated realistic test results
                            switch (ep.LabParameter.Code)
                            {
                                case "GLU":
                                    result.NumericValue = 108.0m;
                                    result.IsOutOfRange = true;
                                    result.AlertLevel = "High";
                                    result.Interpretation = "Glicemia basal alterada en ayunas";
                                    break;
                                case "BUN":
                                    result.NumericValue = 14.5m;
                                    break;
                                case "CREAT":
                                    result.NumericValue = 0.95m;
                                    break;
                                case "AC-URIC":
                                    result.NumericValue = 5.2m;
                                    break;
                                case "COL-TOT":
                                    result.NumericValue = 218.0m;
                                    result.IsOutOfRange = true;
                                    result.AlertLevel = "High";
                                    result.Interpretation = "Hipercolesterolemia leve";
                                    break;
                                case "TRIG":
                                    result.NumericValue = 138.0m;
                                    break;
                                case "HB":
                                    result.NumericValue = 14.8m;
                                    break;
                                case "HCT":
                                    result.NumericValue = 44.0m;
                                    break;
                                case "RBC":
                                    result.NumericValue = 4.9m;
                                    break;
                                case "WBC":
                                    result.NumericValue = 6.8m;
                                    break;
                                case "PLT":
                                    result.NumericValue = 245.0m;
                                    break;
                                case "VPM":
                                    result.NumericValue = 9.2m;
                                    break;
                                case "EGO-ASP":
                                    result.TextValue = "Límpido";
                                    break;
                                case "EGO-COL":
                                    result.TextValue = "Amarillo Paja";
                                    break;
                                case "EGO-DEN":
                                    result.NumericValue = 1.018m;
                                    break;
                                case "EGO-PH":
                                    result.NumericValue = 6.0m;
                                    break;
                                case "EGO-PROT":
                                    result.TextValue = "Negativo";
                                    break;
                                case "EGO-GLU":
                                    result.TextValue = "Negativo";
                                    break;
                                case "EGO-LEUC":
                                    result.NumericValue = 2.0m;
                                    break;
                                case "EGO-BACT":
                                    result.TextValue = "Ausentes";
                                    break;
                                default:
                                    result.NumericValue = ep.LabParameter.DefaultReferenceMin.HasValue ? (ep.LabParameter.DefaultReferenceMin.Value + ep.LabParameter.DefaultReferenceMax.GetValueOrDefault(ep.LabParameter.DefaultReferenceMin.Value)) / 2 : null;
                                    break;
                            }

                            itemCheckup.Results.Add(result);
                        }
                    }

                    orderCompleted.Items.Add(itemCheckup);
                    await context.StudyOrders.AddAsync(orderCompleted);

                    // Orden 2: En Análisis
                    if (studyLipid != null)
                    {
                        var orderInAnalysis = new StudyOrder
                        {
                            Id = Guid.NewGuid(),
                            CompanyId = companyId,
                            PatientId = patient.Id,
                            SpecialistId = specialist?.Id,
                            OrderNumber = $"LAB-{DateTimeOffset.UtcNow.Year}-00002",
                            Status = StudyOrderStatus.InAnalysis,
                            OrderDate = DateTimeOffset.UtcNow.AddHours(-3),
                            ClinicalDiagnosis = "Sospecha de dislipidemia mixta",
                            Notes = "Muestra sanguínea recibida en tubo con gel separador.",
                            TotalAmount = studyLipid.BasePrice
                        };

                        var itemLipid = new StudyOrderItem
                        {
                            Id = Guid.NewGuid(),
                            StudyOrderId = orderInAnalysis.Id,
                            ClinicalStudyId = studyLipid.Id,
                            Price = studyLipid.BasePrice,
                            Status = StudyOrderStatus.InAnalysis
                        };

                        foreach (var se in studyLipid.StudyExams.OrderBy(x => x.SortOrder))
                        {
                            foreach (var ep in se.LabExam.Parameters.OrderBy(x => x.SortOrder))
                            {
                                itemLipid.Results.Add(new StudyOrderResult
                                {
                                    Id = Guid.NewGuid(),
                                    StudyOrderItemId = itemLipid.Id,
                                    LabExamId = se.LabExamId,
                                    LabParameterId = ep.LabParameterId,
                                    ParameterCode = ep.LabParameter.Code,
                                    ParameterName = ep.LabParameter.Name,
                                    Unit = ep.LabParameter.Unit,
                                    ValueType = ep.LabParameter.ValueType,
                                    ReferenceRangeMin = ep.CustomReferenceMin ?? ep.LabParameter.DefaultReferenceMin,
                                    ReferenceRangeMax = ep.CustomReferenceMax ?? ep.LabParameter.DefaultReferenceMax,
                                    ReferenceText = ep.CustomReferenceText ?? ep.LabParameter.DefaultReferenceText,
                                    IsOutOfRange = false,
                                    AlertLevel = "Normal"
                                });
                            }
                        }

                        orderInAnalysis.Items.Add(itemLipid);
                        await context.StudyOrders.AddAsync(orderInAnalysis);
                    }

                    await context.SaveChangesAsync();
                    logger.LogInformation("Sample study orders seeded for company {CompanyId}.", companyId);
                }
            }
        }
    }
}

