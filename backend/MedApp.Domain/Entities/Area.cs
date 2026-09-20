using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class Area : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<Specialty> Specialties { get; set; } = new List<Specialty>();
}
