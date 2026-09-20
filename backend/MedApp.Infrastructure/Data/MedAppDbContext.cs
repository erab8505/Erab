using MedApp.Application.Common.Interfaces;
using MedApp.Domain.Common;
using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Infrastructure.Data;

public class MedAppDbContext : DbContext
{
    private readonly ICompanyContext? _companyContext;

    public MedAppDbContext(DbContextOptions<MedAppDbContext> options, ICompanyContext? companyContext = null)
        : base(options)
    {
        _companyContext = companyContext;
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserCompany> UserCompanies => Set<UserCompany>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<Specialty> Specialties => Set<Specialty>();
    public DbSet<Specialist> Specialists => Set<Specialist>();
    public DbSet<SpecialistAvailability> SpecialistAvailabilities => Set<SpecialistAvailability>();
    public DbSet<InterventionType> InterventionTypes => Set<InterventionType>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Scheduling> Schedulings => Set<Scheduling>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MedAppDbContext).Assembly);

        // Multi-tenant Global Query Filters
        modelBuilder.Entity<Area>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.CompanyId == _companyContext.CompanyId);

        modelBuilder.Entity<Specialty>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.CompanyId == _companyContext.CompanyId);

        modelBuilder.Entity<Specialist>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.CompanyId == _companyContext.CompanyId);

        modelBuilder.Entity<SpecialistAvailability>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.Specialist.CompanyId == _companyContext.CompanyId);

        modelBuilder.Entity<InterventionType>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.CompanyId == _companyContext.CompanyId);

        modelBuilder.Entity<Patient>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.CompanyId == _companyContext.CompanyId);

        modelBuilder.Entity<Scheduling>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.CompanyId == _companyContext.CompanyId);

        modelBuilder.Entity<MedicalRecord>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.CompanyId == _companyContext.CompanyId);

        modelBuilder.Entity<Prescription>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.CompanyId == _companyContext.CompanyId);

        modelBuilder.Entity<PrescriptionItem>()
            .HasQueryFilter(e => _companyContext == null || _companyContext.CompanyId == null || e.Prescription.CompanyId == _companyContext.CompanyId);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.CreatedAt == default)
                {
                    entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
