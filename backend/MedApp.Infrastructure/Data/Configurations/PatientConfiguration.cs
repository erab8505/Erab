using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        builder.ToTable("Patients");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Gender)
            .HasConversion<string>()
            .HasMaxLength(1)
            .IsRequired();

        builder.Property(p => p.DocumentId)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => new { p.CompanyId, p.DocumentId })
            .IsUnique();

        builder.Property(p => p.Email)
            .HasMaxLength(200);

        builder.Property(p => p.Phone)
            .HasMaxLength(30);

        builder.Property(p => p.BloodType)
            .HasMaxLength(20);

        builder.Property(p => p.Allergies)
            .HasColumnType("nvarchar(max)");

        builder.HasOne(p => p.Company)
            .WithMany(c => c.Patients)
            .HasForeignKey(p => p.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
