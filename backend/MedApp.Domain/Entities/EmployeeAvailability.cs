using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class EmployeeAvailability : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public int DayOfWeek { get; set; }
    public string StartHour { get; set; } = string.Empty;
    public string EndHour { get; set; } = string.Empty;
}
