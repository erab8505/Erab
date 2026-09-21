using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class PatientDocumentConfiguration : IEntityTypeConfiguration<PatientDocument>
{
    public void Configure(EntityTypeBuilder<PatientDocument> builder)
    {
        builder.ToTable("PatientDocuments");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(d => d.FileName)
            .HasMaxLength(260)
            .IsRequired();

        builder.Property(d => d.OriginalFileName)
            .HasMaxLength(260)
            .IsRequired();

        builder.Property(d => d.ContentType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(d => d.StoragePath)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(d => d.Category)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.Description)
            .HasMaxLength(500);

        builder.HasOne(d => d.Company)
            .WithMany()
            .HasForeignKey(d => d.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Patient)
            .WithMany()
            .HasForeignKey(d => d.PatientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.MedicalRecord)
            .WithMany()
            .HasForeignKey(d => d.MedicalRecordId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(d => new { d.CompanyId, d.PatientId });
    }
}
