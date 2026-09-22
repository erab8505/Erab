using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class EmployeeAvailabilityConfiguration : IEntityTypeConfiguration<EmployeeAvailability>
{
    public void Configure(EntityTypeBuilder<EmployeeAvailability> builder)
    {
        builder.ToTable("EmployeeAvailabilities");

        builder.HasKey(ea => ea.Id);

        builder.Property(ea => ea.DayOfWeek)
            .IsRequired();

        builder.Property(ea => ea.StartHour)
            .HasMaxLength(5)
            .IsRequired();

        builder.Property(ea => ea.EndHour)
            .HasMaxLength(5)
            .IsRequired();

        builder.HasOne(ea => ea.Employee)
            .WithMany(e => e.Availabilities)
            .HasForeignKey(ea => ea.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ea => new { ea.EmployeeId, ea.DayOfWeek });
    }
}
