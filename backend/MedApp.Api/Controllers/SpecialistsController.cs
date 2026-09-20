using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SpecialistsController : ControllerBase
{
    private readonly ISpecialistService _specialistService;
    private readonly ISpecialistAvailabilityService _availabilityService;

    public SpecialistsController(
        ISpecialistService specialistService,
        ISpecialistAvailabilityService availabilityService)
    {
        _specialistService = specialistService;
        _availabilityService = availabilityService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<SpecialistDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSpecialists([FromQuery] Guid? specialtyId, [FromQuery] bool? activeOnly)
    {
        var specialists = await _specialistService.GetSpecialistsAsync(specialtyId, activeOnly);
        return Ok(ApiResponse<List<SpecialistDto>>.Ok(specialists));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<SpecialistDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSpecialistById(Guid id)
    {
        var specialist = await _specialistService.GetSpecialistByIdAsync(id);
        return Ok(ApiResponse<SpecialistDto>.Ok(specialist));
    }

    [HttpGet("{id:guid}/availability")]
    [ProducesResponseType(typeof(ApiResponse<List<SpecialistAvailabilityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSpecialistAvailability(Guid id)
    {
        var availability = await _availabilityService.GetAvailabilityBySpecialistAsync(id);
        return Ok(ApiResponse<List<SpecialistAvailabilityDto>>.Ok(availability));
    }

    [HttpGet("{id:guid}/slots")]
    [ProducesResponseType(typeof(ApiResponse<List<TimeSlotDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableSlots(Guid id, [FromQuery] string date)
    {
        if (!DateOnly.TryParse(date, out var parsedDate))
        {
            return BadRequest(ApiResponse.Fail("Formato de fecha inválido. Utilice el formato YYYY-MM-DD."));
        }

        var slots = await _availabilityService.GetAvailableSlotsAsync(id, parsedDate);
        return Ok(ApiResponse<List<TimeSlotDto>>.Ok(slots));
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<SpecialistDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateSpecialist([FromBody] CreateSpecialistDto dto)
    {
        var created = await _specialistService.CreateSpecialistAsync(dto);
        return CreatedAtAction(nameof(GetSpecialistById), new { id = created.Id },
            ApiResponse<SpecialistDto>.Ok(created, "Especialista registrado exitosamente."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<SpecialistDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateSpecialist(Guid id, [FromBody] UpdateSpecialistDto dto)
    {
        var updated = await _specialistService.UpdateSpecialistAsync(id, dto);
        return Ok(ApiResponse<SpecialistDto>.Ok(updated, "Especialista actualizado exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteSpecialist(Guid id)
    {
        await _specialistService.DeleteSpecialistAsync(id);
        return Ok(ApiResponse.Ok("Especialista eliminado exitosamente."));
    }
}
