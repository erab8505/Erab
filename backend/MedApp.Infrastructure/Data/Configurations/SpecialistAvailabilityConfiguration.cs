using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class SpecialistAvailabilityConfiguration : IEntityTypeConfiguration<SpecialistAvailability>
{
    public void Configure(EntityTypeBuilder<SpecialistAvailability> builder)
    {
        builder.ToTable("SpecialistAvailabilities");

        builder.HasKey(sa => sa.Id);

        builder.Property(sa => sa.StartHour)
            .IsRequired()
            .HasMaxLength(5);

        builder.Property(sa => sa.EndHour)
            .IsRequired()
            .HasMaxLength(5);

        builder.HasOne(sa => sa.Specialist)
            .WithMany(s => s.Availabilities)
            .HasForeignKey(sa => sa.SpecialistId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
