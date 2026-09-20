using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AreasController : ControllerBase
{
    private readonly IAreaService _areaService;

    public AreasController(IAreaService areaService)
    {
        _areaService = areaService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<AreaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAreas()
    {
        var areas = await _areaService.GetAreasAsync();
        return Ok(ApiResponse<List<AreaDto>>.Ok(areas));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AreaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAreaById(Guid id)
    {
        var area = await _areaService.GetAreaByIdAsync(id);
        return Ok(ApiResponse<AreaDto>.Ok(area));
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<AreaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateArea([FromBody] CreateAreaDto dto)
    {
        var created = await _areaService.CreateAreaAsync(dto);
        return CreatedAtAction(nameof(GetAreaById), new { id = created.Id },
            ApiResponse<AreaDto>.Ok(created, "Área creada exitosamente."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<AreaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateArea(Guid id, [FromBody] UpdateAreaDto dto)
    {
        var updated = await _areaService.UpdateAreaAsync(id, dto);
        return Ok(ApiResponse<AreaDto>.Ok(updated, "Área actualizada exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteArea(Guid id)
    {
        await _areaService.DeleteAreaAsync(id);
        return Ok(ApiResponse.Ok("Área eliminada exitosamente."));
    }
}
