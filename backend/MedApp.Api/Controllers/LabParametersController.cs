using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/lab-parameters")]
public class LabParametersController : ControllerBase
{
    private readonly ILabParameterService _parameterService;

    public LabParametersController(ILabParameterService parameterService)
    {
        _parameterService = parameterService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<LabParameterDto>>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _parameterService.GetAllAsync(search, isActive, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<LabParameterDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _parameterService.GetByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LabParameterDto>>> Create([FromBody] CreateLabParameterDto dto, CancellationToken cancellationToken)
    {
        var result = await _parameterService.CreateAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<LabParameterDto>>> Update(Guid id, [FromBody] UpdateLabParameterDto dto, CancellationToken cancellationToken)
    {
        var result = await _parameterService.UpdateAsync(id, dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _parameterService.DeleteAsync(id, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
