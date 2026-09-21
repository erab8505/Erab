using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }

    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string Username { get; set; } = string.Empty;
    public UserRole UserRole { get; set; }

    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? DetailsJson { get; set; }
    public string? IpAddress { get; set; }
}
