using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/specialist-availability")]
[Authorize(Policy = "RequireClinicalRole")]
public class SpecialistAvailabilityController : ControllerBase
{
    private readonly ISpecialistAvailabilityService _availabilityService;

    public SpecialistAvailabilityController(ISpecialistAvailabilityService availabilityService)
    {
        _availabilityService = availabilityService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<SpecialistAvailabilityDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddAvailability([FromBody] CreateSpecialistAvailabilityDto dto)
    {
        var created = await _availabilityService.AddAvailabilityAsync(dto);
        return CreatedAtAction(nameof(AddAvailability), new { id = created.Id },
            ApiResponse<SpecialistAvailabilityDto>.Ok(created, "Horario de disponibilidad configurado exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAvailability(Guid id)
    {
        await _availabilityService.DeleteAvailabilityAsync(id);
        return Ok(ApiResponse.Ok("Horario de disponibilidad eliminado exitosamente."));
    }
}
