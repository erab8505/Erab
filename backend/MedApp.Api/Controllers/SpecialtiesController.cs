using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SpecialtiesController : ControllerBase
{
    private readonly ISpecialtyService _specialtyService;

    public SpecialtiesController(ISpecialtyService specialtyService)
    {
        _specialtyService = specialtyService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<SpecialtyDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSpecialties([FromQuery] Guid? areaId)
    {
        var specialties = await _specialtyService.GetSpecialtiesAsync(areaId);
        return Ok(ApiResponse<List<SpecialtyDto>>.Ok(specialties));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<SpecialtyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSpecialtyById(Guid id)
    {
        var specialty = await _specialtyService.GetSpecialtyByIdAsync(id);
        return Ok(ApiResponse<SpecialtyDto>.Ok(specialty));
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<SpecialtyDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateSpecialty([FromBody] CreateSpecialtyDto dto)
    {
        var created = await _specialtyService.CreateSpecialtyAsync(dto);
        return CreatedAtAction(nameof(GetSpecialtyById), new { id = created.Id },
            ApiResponse<SpecialtyDto>.Ok(created, "Especialidad creada exitosamente."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<SpecialtyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSpecialty(Guid id, [FromBody] UpdateSpecialtyDto dto)
    {
        var updated = await _specialtyService.UpdateSpecialtyAsync(id, dto);
        return Ok(ApiResponse<SpecialtyDto>.Ok(updated, "Especialidad actualizada exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSpecialty(Guid id)
    {
        await _specialtyService.DeleteSpecialtyAsync(id);
        return Ok(ApiResponse.Ok("Especialidad eliminada exitosamente."));
    }
}
