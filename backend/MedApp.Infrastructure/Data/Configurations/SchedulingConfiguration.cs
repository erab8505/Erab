using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class SchedulingConfiguration : IEntityTypeConfiguration<Scheduling>
{
    public void Configure(EntityTypeBuilder<Scheduling> builder)
    {
        builder.ToTable("Schedulings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.ScheduledAt)
            .HasColumnType("datetimeoffset")
            .IsRequired();

        builder.Property(s => s.DurationMinutes)
            .IsRequired();

        builder.Property(s => s.Notes)
            .HasMaxLength(1000);

        builder.Property(s => s.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(s => new { s.SpecialistId, s.ScheduledAt });

        builder.HasOne(s => s.Company)
            .WithMany(c => c.Schedulings)
            .HasForeignKey(s => s.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Patient)
            .WithMany(p => p.Schedulings)
            .HasForeignKey(s => s.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Specialist)
            .WithMany(sp => sp.Schedulings)
            .HasForeignKey(s => s.SpecialistId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.InterventionType)
            .WithMany(i => i.Schedulings)
            .HasForeignKey(s => s.InterventionTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
