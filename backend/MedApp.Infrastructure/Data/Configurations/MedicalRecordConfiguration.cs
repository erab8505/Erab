using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class MedicalRecordConfiguration : IEntityTypeConfiguration<MedicalRecord>
{
    public void Configure(EntityTypeBuilder<MedicalRecord> builder)
    {
        builder.ToTable("MedicalRecords");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.RecordDate)
            .HasColumnType("datetimeoffset")
            .IsRequired();

        builder.Property(m => m.Diagnosis)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(m => m.Treatment)
            .HasColumnType("nvarchar(max)");

        builder.Property(m => m.Notes)
            .HasColumnType("nvarchar(max)");

        // Decimal precisions as specified in plan & tasks
        builder.Property(m => m.WeightKg)
            .HasColumnType("decimal(5,2)");

        builder.Property(m => m.HeightCm)
            .HasColumnType("decimal(5,2)");

        builder.Property(m => m.TemperatureCelsius)
            .HasColumnType("decimal(4,1)");

        builder.HasOne(m => m.Company)
            .WithMany(c => c.MedicalRecords)
            .HasForeignKey(m => m.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Patient)
            .WithMany(p => p.MedicalRecords)
            .HasForeignKey(m => m.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.InterventionType)
            .WithMany(i => i.MedicalRecords)
            .HasForeignKey(m => m.InterventionTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
