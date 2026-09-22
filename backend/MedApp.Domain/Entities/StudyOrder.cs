using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class StudyOrder : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid? RequestingDoctorId { get; set; }
    public Employee? RequestingDoctor { get; set; }

    public Guid? SchedulingId { get; set; }
    public Scheduling? Scheduling { get; set; }

    public string OrderNumber { get; set; } = string.Empty;
    public StudyOrderStatus Status { get; set; } = StudyOrderStatus.Requested;
    public DateTimeOffset OrderDate { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedDate { get; set; }
    public string? ClinicalDiagnosis { get; set; }
    public string? Notes { get; set; }
    public decimal TotalAmount { get; set; }

    public Guid? LaboratoristId { get; set; }
    public Employee? Laboratorist { get; set; }
    public string? LaboratoristName { get; set; }

    public ICollection<StudyOrderItem> Items { get; set; } = new List<StudyOrderItem>();
}
