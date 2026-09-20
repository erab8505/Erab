using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class SpecialistConfiguration : IEntityTypeConfiguration<Specialist>
{
    public void Configure(EntityTypeBuilder<Specialist> builder)
    {
        builder.ToTable("Specialists");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.LicenseNumber)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Email)
            .HasMaxLength(200);

        builder.Property(s => s.Phone)
            .HasMaxLength(30);

        builder.HasIndex(s => new { s.CompanyId, s.LicenseNumber })
            .IsUnique();

        builder.HasOne(s => s.Specialty)
            .WithMany(sp => sp.Specialists)
            .HasForeignKey(s => s.SpecialtyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Company)
            .WithMany(c => c.Specialists)
            .HasForeignKey(s => s.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
