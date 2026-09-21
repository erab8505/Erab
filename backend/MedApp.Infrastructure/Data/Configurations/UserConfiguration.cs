using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(u => u.Username)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .IsRequired();

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.HasOne(u => u.Specialist)
            .WithMany()
            .HasForeignKey(u => u.SpecialistId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(u => u.Receptionist)
            .WithMany()
            .HasForeignKey(u => u.ReceptionistId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
