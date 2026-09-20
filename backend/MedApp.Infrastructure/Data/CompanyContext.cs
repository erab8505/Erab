using MedApp.Application.Common.Interfaces;

namespace MedApp.Infrastructure.Data;

public class CompanyContext : ICompanyContext
{
    public Guid? CompanyId { get; private set; }

    public void SetCompany(Guid companyId)
    {
        CompanyId = companyId;
    }
}
