using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class InterventionTypeConfiguration : IEntityTypeConfiguration<InterventionType>
{
    public void Configure(EntityTypeBuilder<InterventionType> builder)
    {
        builder.ToTable("InterventionTypes");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(i => i.Code)
            .HasMaxLength(50);

        builder.HasIndex(i => new { i.CompanyId, i.Code })
            .IsUnique()
            .HasFilter("[Code] IS NOT NULL");

        builder.Property(i => i.Description)
            .HasColumnType("nvarchar(max)");

        builder.HasOne(i => i.Specialty)
            .WithMany(s => s.InterventionTypes)
            .HasForeignKey(i => i.SpecialtyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Company)
            .WithMany(c => c.InterventionTypes)
            .HasForeignKey(i => i.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
