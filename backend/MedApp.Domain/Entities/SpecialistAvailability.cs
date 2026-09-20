using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class SpecialistAvailability : BaseEntity
{
    public Guid SpecialistId { get; set; }
    public Specialist Specialist { get; set; } = null!;

    public int DayOfWeek { get; set; } // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    public string StartHour { get; set; } = "08:00"; // HH:mm
    public string EndHour { get; set; } = "17:00"; // HH:mm
}
