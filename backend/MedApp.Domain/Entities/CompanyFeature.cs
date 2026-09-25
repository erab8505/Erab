using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class CompanyFeature : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string FeatureKey { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public string? ConfigValue { get; set; }
}
