using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/lab-exams")]
public class LabExamsController : ControllerBase
{
    private readonly ILabExamService _examService;

    public LabExamsController(ILabExamService examService)
    {
        _examService = examService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<LabExamDto>>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _examService.GetAllAsync(search, isActive, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<LabExamDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _examService.GetByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LabExamDto>>> Create([FromBody] CreateLabExamDto dto, CancellationToken cancellationToken)
    {
        var result = await _examService.CreateAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<LabExamDto>>> Update(Guid id, [FromBody] UpdateLabExamDto dto, CancellationToken cancellationToken)
    {
        var result = await _examService.UpdateAsync(id, dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _examService.DeleteAsync(id, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
