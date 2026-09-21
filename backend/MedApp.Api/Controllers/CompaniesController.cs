using System.Security.Claims;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyService _companyService;

    public CompaniesController(ICompanyService companyService)
    {
        _companyService = companyService;
    }

    [HttpGet("mine")]
    [ProducesResponseType(typeof(ApiResponse<List<CompanyDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyCompanies()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(ApiResponse.Fail("Usuario no autenticado correctamente."));

        var companies = await _companyService.GetMyCompaniesAsync(userId);
        return Ok(ApiResponse<List<CompanyDto>>.Ok(companies));
    }

    [HttpGet]
    [Authorize(Policy = "RequireSuperAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<List<CompanyDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllCompanies()
    {
        var companies = await _companyService.GetAllCompaniesAsync();
        return Ok(ApiResponse<List<CompanyDto>>.Ok(companies));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<CompanyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCompanyById(Guid id)
    {
        var company = await _companyService.GetCompanyByIdAsync(id);
        return Ok(ApiResponse<CompanyDto>.Ok(company));
    }

    [HttpPost]
    [Authorize(Policy = "RequireSuperAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<CompanyDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyDto dto)
    {
        var created = await _companyService.CreateCompanyAsync(dto);
        return CreatedAtAction(nameof(GetCompanyById), new { id = created.Id },
            ApiResponse<CompanyDto>.Ok(created, "Empresa creada exitosamente."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<CompanyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCompany(Guid id, [FromBody] UpdateCompanyDto dto)
    {
        var updated = await _companyService.UpdateCompanyAsync(id, dto);
        return Ok(ApiResponse<CompanyDto>.Ok(updated, "Empresa actualizada exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireSuperAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCompany(Guid id)
    {
        await _companyService.DeleteCompanyAsync(id);
        return Ok(ApiResponse.Ok("Empresa eliminada exitosamente."));
    }
}
