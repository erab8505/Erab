using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class Company : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? TaxId { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }

    public ICollection<UserCompany> UserCompanies { get; set; } = new List<UserCompany>();
    public ICollection<Area> Areas { get; set; } = new List<Area>();
    public ICollection<Specialty> Specialties { get; set; } = new List<Specialty>();
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<InterventionType> InterventionTypes { get; set; } = new List<InterventionType>();
    public ICollection<Patient> Patients { get; set; } = new List<Patient>();
    public ICollection<Scheduling> Schedulings { get; set; } = new List<Scheduling>();
    public ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
    public ICollection<CompanyFeature> Features { get; set; } = new List<CompanyFeature>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
