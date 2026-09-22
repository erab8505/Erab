using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class Specialty : BaseEntity
{
    public Guid AreaId { get; set; }
    public Area Area { get; set; } = null!;

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<InterventionType> InterventionTypes { get; set; } = new List<InterventionType>();
}
