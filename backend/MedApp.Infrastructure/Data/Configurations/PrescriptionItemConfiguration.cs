using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class PrescriptionItemConfiguration : IEntityTypeConfiguration<PrescriptionItem>
{
    public void Configure(EntityTypeBuilder<PrescriptionItem> builder)
    {
        builder.ToTable("PrescriptionItems");

        builder.HasKey(pi => pi.Id);

        builder.Property(pi => pi.MedicationName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(pi => pi.Dosage)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(pi => pi.Frequency)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(pi => pi.DurationDays)
            .IsRequired();

        builder.Property(pi => pi.Instructions)
            .HasMaxLength(500);

        builder.HasOne(pi => pi.Prescription)
            .WithMany(p => p.Items)
            .HasForeignKey(pi => pi.PrescriptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
