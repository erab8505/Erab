using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class Employee : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();

    public string? IdentificationNumber { get; set; }
    public string? LicenseNumber { get; set; }
    public string? JobTitle { get; set; }

    public Guid? SpecialtyId { get; set; }
    public Specialty? Specialty { get; set; }

    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<EmployeeAvailability> Availabilities { get; set; } = new List<EmployeeAvailability>();
}
