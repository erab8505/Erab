using MedApp.Domain.Entities;

namespace MedApp.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user, IEnumerable<Guid> companyIds);
}
