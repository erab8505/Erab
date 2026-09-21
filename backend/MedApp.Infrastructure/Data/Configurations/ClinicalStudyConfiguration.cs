using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class LabParameterConfiguration : IEntityTypeConfiguration<LabParameter>
{
    public void Configure(EntityTypeBuilder<LabParameter> builder)
    {
        builder.ToTable("LabParameters");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(p => p.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.Description)
            .HasMaxLength(1000);

        builder.Property(p => p.Unit)
            .HasMaxLength(50);

        builder.Property(p => p.ValueType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(p => p.DefaultReferenceMin)
            .HasColumnType("decimal(18,4)");

        builder.Property(p => p.DefaultReferenceMax)
            .HasColumnType("decimal(18,4)");

        builder.Property(p => p.DefaultReferenceText)
            .HasMaxLength(500);

        builder.Property(p => p.DefaultReagentName)
            .HasMaxLength(200);

        builder.Property(p => p.DefaultReagentQuantity)
            .HasColumnType("decimal(18,4)");

        builder.HasOne(p => p.Company)
            .WithMany()
            .HasForeignKey(p => p.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.CompanyId, p.Code });
        builder.HasIndex(p => new { p.CompanyId, p.Name });
    }
}

public class LabExamConfiguration : IEntityTypeConfiguration<LabExam>
{
    public void Configure(EntityTypeBuilder<LabExam> builder)
    {
        builder.ToTable("LabExams");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        builder.Property(e => e.SampleType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Method)
            .HasMaxLength(150);

        builder.HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Parameters)
            .WithOne(p => p.LabExam)
            .HasForeignKey(p => p.LabExamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.CompanyId, e.Code });
        builder.HasIndex(e => new { e.CompanyId, e.Name });
    }
}

public class LabExamParameterConfiguration : IEntityTypeConfiguration<LabExamParameter>
{
    public void Configure(EntityTypeBuilder<LabExamParameter> builder)
    {
        builder.ToTable("LabExamParameters");

        builder.HasKey(ep => ep.Id);

        builder.Property(ep => ep.CustomReferenceMin)
            .HasColumnType("decimal(18,4)");

        builder.Property(ep => ep.CustomReferenceMax)
            .HasColumnType("decimal(18,4)");

        builder.Property(ep => ep.CustomReferenceText)
            .HasMaxLength(500);

        builder.HasOne(ep => ep.LabExam)
            .WithMany(e => e.Parameters)
            .HasForeignKey(ep => ep.LabExamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ep => ep.LabParameter)
            .WithMany(p => p.ExamParameters)
            .HasForeignKey(ep => ep.LabParameterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ep => new { ep.LabExamId, ep.LabParameterId });
    }
}

public class ClinicalStudyConfiguration : IEntityTypeConfiguration<ClinicalStudy>
{
    public void Configure(EntityTypeBuilder<ClinicalStudy> builder)
    {
        builder.ToTable("ClinicalStudies");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.Description)
            .HasMaxLength(1000);

        builder.Property(s => s.Category)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.BasePrice)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(s => s.PreparationInstructions)
            .HasMaxLength(1000);

        builder.HasOne(s => s.Company)
            .WithMany()
            .HasForeignKey(s => s.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.StudyExams)
            .WithOne(se => se.ClinicalStudy)
            .HasForeignKey(se => se.ClinicalStudyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.CompanyId, s.Code });
        builder.HasIndex(s => new { s.CompanyId, s.Category });
    }
}

public class ClinicalStudyExamConfiguration : IEntityTypeConfiguration<ClinicalStudyExam>
{
    public void Configure(EntityTypeBuilder<ClinicalStudyExam> builder)
    {
        builder.ToTable("ClinicalStudyExams");

        builder.HasKey(se => se.Id);

        builder.HasOne(se => se.ClinicalStudy)
            .WithMany(s => s.StudyExams)
            .HasForeignKey(se => se.ClinicalStudyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(se => se.LabExam)
            .WithMany(e => e.StudyExams)
            .HasForeignKey(se => se.LabExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(se => new { se.ClinicalStudyId, se.LabExamId });
    }
}
