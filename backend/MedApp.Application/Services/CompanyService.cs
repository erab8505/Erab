using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class CompanyService : ICompanyService
{
    private readonly IApplicationDbContext _context;

    public CompanyService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CompanyDto>> GetAllCompaniesAsync()
    {
        return await _context.Companies
            .OrderBy(c => c.Name)
            .Select(c => new CompanyDto(
                c.Id, c.Name, c.TaxId, c.Address, c.Phone, c.Email, c.IsActive, c.Description, c.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<List<CompanyDto>> GetMyCompaniesAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .Include(u => u.UserCompanies)
                .ThenInclude(uc => uc.Company)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new NotFoundException("Usuario no encontrado.");

        if (user.UserRoles.Any(r => r.Role == UserRole.SuperAdmin))
        {
            return await GetAllCompaniesAsync();
        }

        return user.UserCompanies
            .Where(uc => uc.Company != null && uc.Company.IsActive)
            .Select(uc => new CompanyDto(
                uc.Company.Id, uc.Company.Name, uc.Company.TaxId, uc.Company.Address,
                uc.Company.Phone, uc.Company.Email, uc.Company.IsActive, uc.Company.Description, uc.Company.CreatedAt
            ))
            .OrderBy(c => c.Name)
            .ToList();
    }

    public async Task<CompanyDto> GetCompanyByIdAsync(Guid id)
    {
        var company = await _context.Companies.FindAsync(id);
        if (company == null)
            throw new NotFoundException("Empresa", id);

        return new CompanyDto(
            company.Id, company.Name, company.TaxId, company.Address,
            company.Phone, company.Email, company.IsActive, company.Description, company.CreatedAt
        );
    }

    public async Task<CompanyDto> CreateCompanyAsync(CreateCompanyDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.TaxId))
        {
            var exists = await _context.Companies.AnyAsync(c => c.TaxId == dto.TaxId);
            if (exists)
                throw new ConflictException($"Ya existe una empresa registrada con el Tax ID / RIF '{dto.TaxId}'.");
        }

        var company = new Company
        {
            Name = dto.Name,
            TaxId = dto.TaxId,
            Address = dto.Address,
            Phone = dto.Phone,
            Email = dto.Email,
            IsActive = dto.IsActive,
            Description = dto.Description
        };

        await _context.Companies.AddAsync(company);
        await _context.SaveChangesAsync();

        return new CompanyDto(
            company.Id, company.Name, company.TaxId, company.Address,
            company.Phone, company.Email, company.IsActive, company.Description, company.CreatedAt
        );
    }

    public async Task<CompanyDto> UpdateCompanyAsync(Guid id, UpdateCompanyDto dto)
    {
        var company = await _context.Companies.FindAsync(id);
        if (company == null)
            throw new NotFoundException("Empresa", id);

        if (!string.IsNullOrWhiteSpace(dto.TaxId) && dto.TaxId != company.TaxId)
        {
            var exists = await _context.Companies.AnyAsync(c => c.TaxId == dto.TaxId && c.Id != id);
            if (exists)
                throw new ConflictException($"Ya existe otra empresa registrada con el Tax ID / RIF '{dto.TaxId}'.");
        }

        company.Name = dto.Name;
        company.TaxId = dto.TaxId;
        company.Address = dto.Address;
        company.Phone = dto.Phone;
        company.Email = dto.Email;
        company.IsActive = dto.IsActive;
        company.Description = dto.Description;

        await _context.SaveChangesAsync();

        return new CompanyDto(
            company.Id, company.Name, company.TaxId, company.Address,
            company.Phone, company.Email, company.IsActive, company.Description, company.CreatedAt
        );
    }

    public async Task<bool> DeleteCompanyAsync(Guid id)
    {
        var company = await _context.Companies
            .Include(c => c.Areas)
            .Include(c => c.Patients)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (company == null)
            throw new NotFoundException("Empresa", id);

        if (company.Areas.Any() || company.Patients.Any())
        {
            throw new ConflictException("No se puede eliminar la empresa porque contiene áreas o pacientes asociados. Desactívela en su lugar.");
        }

        _context.Companies.Remove(company);
        await _context.SaveChangesAsync();
        return true;
    }
}
