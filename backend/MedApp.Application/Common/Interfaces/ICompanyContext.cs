namespace MedApp.Application.Common.Interfaces;

public interface ICompanyContext
{
    Guid? CompanyId { get; }
    void SetCompany(Guid companyId);
}
