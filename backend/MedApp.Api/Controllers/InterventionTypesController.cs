using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/intervention-types")]
[Authorize]
public class InterventionTypesController : ControllerBase
{
    private readonly IInterventionTypeService _interventionService;

    public InterventionTypesController(IInterventionTypeService interventionService)
    {
        _interventionService = interventionService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<InterventionTypeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInterventionTypes([FromQuery] Guid? specialtyId, [FromQuery] bool? activeOnly)
    {
        var types = await _interventionService.GetInterventionTypesAsync(specialtyId, activeOnly);
        return Ok(ApiResponse<List<InterventionTypeDto>>.Ok(types));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<InterventionTypeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInterventionTypeById(Guid id)
    {
        var type = await _interventionService.GetInterventionTypeByIdAsync(id);
        return Ok(ApiResponse<InterventionTypeDto>.Ok(type));
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<InterventionTypeDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateInterventionType([FromBody] CreateInterventionTypeDto dto)
    {
        var created = await _interventionService.CreateInterventionTypeAsync(dto);
        return CreatedAtAction(nameof(GetInterventionTypeById), new { id = created.Id },
            ApiResponse<InterventionTypeDto>.Ok(created, "Procedimiento creado exitosamente."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<InterventionTypeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateInterventionType(Guid id, [FromBody] UpdateInterventionTypeDto dto)
    {
        var updated = await _interventionService.UpdateInterventionTypeAsync(id, dto);
        return Ok(ApiResponse<InterventionTypeDto>.Ok(updated, "Procedimiento actualizado exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteInterventionType(Guid id)
    {
        await _interventionService.DeleteInterventionTypeAsync(id);
        return Ok(ApiResponse.Ok("Procedimiento eliminado exitosamente."));
    }
}
