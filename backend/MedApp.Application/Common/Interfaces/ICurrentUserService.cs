namespace MedApp.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Role { get; }
    Guid? SpecialistId { get; }
    bool IsSuperAdmin { get; }
    bool IsAdmin { get; }
    bool IsSpecialist { get; }
    bool IsReceptionist { get; }
    bool IsLaboratorist { get; }
}
