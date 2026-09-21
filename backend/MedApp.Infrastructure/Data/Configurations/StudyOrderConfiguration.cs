using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MedApp.Infrastructure.Data.Configurations;

public class StudyOrderConfiguration : IEntityTypeConfiguration<StudyOrder>
{
    public void Configure(EntityTypeBuilder<StudyOrder> builder)
    {
        builder.ToTable("StudyOrders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(o => o.ClinicalDiagnosis)
            .HasMaxLength(500);

        builder.Property(o => o.Notes)
            .HasMaxLength(1000);

        builder.Property(o => o.LaboratoristName)
            .HasMaxLength(200);

        builder.Property(o => o.TotalAmount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.HasOne(o => o.Company)
            .WithMany()
            .HasForeignKey(o => o.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Patient)
            .WithMany()
            .HasForeignKey(o => o.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Specialist)
            .WithMany()
            .HasForeignKey(o => o.SpecialistId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.Scheduling)
            .WithMany()
            .HasForeignKey(o => o.SchedulingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(o => o.Items)
            .WithOne(i => i.StudyOrder)
            .HasForeignKey(i => i.StudyOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => new { o.CompanyId, o.OrderNumber }).IsUnique();
        builder.HasIndex(o => new { o.CompanyId, o.Status });
        builder.HasIndex(o => o.PatientId);
    }
}

public class StudyOrderItemConfiguration : IEntityTypeConfiguration<StudyOrderItem>
{
    public void Configure(EntityTypeBuilder<StudyOrderItem> builder)
    {
        builder.ToTable("StudyOrderItems");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Price)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(i => i.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(i => i.Observations)
            .HasMaxLength(500);

        builder.HasOne(i => i.ClinicalStudy)
            .WithMany()
            .HasForeignKey(i => i.ClinicalStudyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(i => i.Results)
            .WithOne(r => r.StudyOrderItem)
            .HasForeignKey(r => r.StudyOrderItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class StudyOrderResultConfiguration : IEntityTypeConfiguration<StudyOrderResult>
{
    public void Configure(EntityTypeBuilder<StudyOrderResult> builder)
    {
        builder.ToTable("StudyOrderResults");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.ParameterCode)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.ParameterName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(r => r.Unit)
            .HasMaxLength(50);

        builder.Property(r => r.ValueType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.NumericValue)
            .HasColumnType("decimal(18,4)");

        builder.Property(r => r.TextValue)
            .HasMaxLength(500);

        builder.Property(r => r.ReferenceRangeMin)
            .HasColumnType("decimal(18,4)");

        builder.Property(r => r.ReferenceRangeMax)
            .HasColumnType("decimal(18,4)");

        builder.Property(r => r.ReferenceText)
            .HasMaxLength(500);

        builder.Property(r => r.AlertLevel)
            .HasMaxLength(50);

        builder.Property(r => r.Interpretation)
            .HasMaxLength(1000);

        builder.Property(r => r.TechnicianNotes)
            .HasMaxLength(500);

        builder.HasOne(r => r.LabExam)
            .WithMany()
            .HasForeignKey(r => r.LabExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.LabParameter)
            .WithMany()
            .HasForeignKey(r => r.LabParameterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
