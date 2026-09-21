using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Receptionist;
    public Guid? SpecialistId { get; set; }
    public Specialist? Specialist { get; set; }

    public Guid? ReceptionistId { get; set; }
    public Receptionist? Receptionist { get; set; }

    public ICollection<UserCompany> UserCompanies { get; set; } = new List<UserCompany>();
}
