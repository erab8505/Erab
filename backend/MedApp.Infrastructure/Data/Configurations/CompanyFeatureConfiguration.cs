using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class CompanyFeatureConfiguration : IEntityTypeConfiguration<CompanyFeature>
{
    public void Configure(EntityTypeBuilder<CompanyFeature> builder)
    {
        builder.ToTable("CompanyFeatures");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.FeatureKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.IsEnabled)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(f => f.ConfigValue)
            .HasColumnType("nvarchar(max)");

        builder.HasOne(f => f.Company)
            .WithMany(c => c.Features)
            .HasForeignKey(f => f.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => new { f.CompanyId, f.FeatureKey })
            .IsUnique();
    }
}
