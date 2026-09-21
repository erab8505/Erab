using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class Specialist : BaseEntity
{
    public Guid SpecialtyId { get; set; }
    public Specialty Specialty { get; set; } = null!;

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string LicenseNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<SpecialistAvailability> Availabilities { get; set; } = new List<SpecialistAvailability>();
    public ICollection<Scheduling> Schedulings { get; set; } = new List<Scheduling>();
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
