using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class Scheduling : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid SpecialistId { get; set; }
    public Specialist Specialist { get; set; } = null!;

    public Guid InterventionTypeId { get; set; }
    public InterventionType InterventionType { get; set; } = null!;

    public DateTimeOffset ScheduledAt { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public string? Notes { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;
}
