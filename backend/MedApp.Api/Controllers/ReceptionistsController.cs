using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReceptionistsController : ControllerBase
{
    private readonly IReceptionistService _receptionistService;

    public ReceptionistsController(IReceptionistService receptionistService)
    {
        _receptionistService = receptionistService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<ReceptionistDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReceptionists([FromQuery] bool? activeOnly)
    {
        var list = await _receptionistService.GetReceptionistsAsync(activeOnly);
        return Ok(ApiResponse<List<ReceptionistDto>>.Ok(list));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ReceptionistDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReceptionistById(Guid id)
    {
        var receptionist = await _receptionistService.GetReceptionistByIdAsync(id);
        return Ok(ApiResponse<ReceptionistDto>.Ok(receptionist));
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<ReceptionistDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateReceptionist([FromBody] CreateReceptionistDto dto)
    {
        var created = await _receptionistService.CreateReceptionistAsync(dto);
        return CreatedAtAction(nameof(GetReceptionistById), new { id = created.Id },
            ApiResponse<ReceptionistDto>.Ok(created, "Recepcionista registrado exitosamente."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<ReceptionistDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateReceptionist(Guid id, [FromBody] UpdateReceptionistDto dto)
    {
        var updated = await _receptionistService.UpdateReceptionistAsync(id, dto);
        return Ok(ApiResponse<ReceptionistDto>.Ok(updated, "Recepcionista actualizado exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteReceptionist(Guid id)
    {
        await _receptionistService.DeleteReceptionistAsync(id);
        return Ok(ApiResponse.Ok("Recepcionista eliminado exitosamente."));
    }
}
