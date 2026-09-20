using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class PrescriptionConfiguration : IEntityTypeConfiguration<Prescription>
{
    public void Configure(EntityTypeBuilder<Prescription> builder)
    {
        builder.ToTable("Prescriptions");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.PrescriptionDate)
            .HasColumnType("datetimeoffset")
            .IsRequired();

        builder.Property(p => p.Notes)
            .HasMaxLength(2000);

        builder.HasOne(p => p.Company)
            .WithMany(c => c.Prescriptions)
            .HasForeignKey(p => p.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Patient)
            .WithMany(pat => pat.Prescriptions)
            .HasForeignKey(p => p.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.MedicalRecord)
            .WithMany(m => m.Prescriptions)
            .HasForeignKey(p => p.MedicalRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Specialist)
            .WithMany(s => s.Prescriptions)
            .HasForeignKey(p => p.SpecialistId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
