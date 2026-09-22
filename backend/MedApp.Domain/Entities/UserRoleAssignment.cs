using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class UserRoleAssignment : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public UserRole Role { get; set; }
}
