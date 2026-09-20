using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface ICompanyService
{
    Task<List<CompanyDto>> GetAllCompaniesAsync();
    Task<List<CompanyDto>> GetMyCompaniesAsync(Guid userId);
    Task<CompanyDto> GetCompanyByIdAsync(Guid id);
    Task<CompanyDto> CreateCompanyAsync(CreateCompanyDto dto);
    Task<CompanyDto> UpdateCompanyAsync(Guid id, UpdateCompanyDto dto);
    Task<bool> DeleteCompanyAsync(Guid id);
}
