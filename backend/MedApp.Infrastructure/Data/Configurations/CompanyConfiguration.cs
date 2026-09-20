using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.TaxId)
            .HasMaxLength(50);

        builder.HasIndex(c => c.TaxId)
            .IsUnique()
            .HasFilter("[TaxId] IS NOT NULL");

        builder.Property(c => c.Address)
            .HasMaxLength(500);

        builder.Property(c => c.Phone)
            .HasMaxLength(30);

        builder.Property(c => c.Email)
            .HasMaxLength(200);

        builder.Property(c => c.Description)
            .HasColumnType("nvarchar(max)");
    }
}
