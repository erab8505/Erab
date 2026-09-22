using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.IdentificationNumber)
            .HasMaxLength(50);

        builder.Property(e => e.LicenseNumber)
            .HasMaxLength(50);

        builder.Property(e => e.JobTitle)
            .HasMaxLength(150);

        builder.Property(e => e.Email)
            .HasMaxLength(150);

        builder.Property(e => e.Phone)
            .HasMaxLength(50);

        builder.Property(e => e.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.HasOne(e => e.Company)
            .WithMany(c => c.Employees)
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Specialty)
            .WithMany(s => s.Employees)
            .HasForeignKey(e => e.SpecialtyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => new { e.CompanyId, e.IsActive });
        builder.HasIndex(e => new { e.CompanyId, e.IdentificationNumber });
    }
}
