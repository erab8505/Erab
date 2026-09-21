using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/study-orders")]
public class StudyOrdersController : ControllerBase
{
    private readonly IStudyOrderService _orderService;

    public StudyOrdersController(IStudyOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<StudyOrderDto>>>> GetAll(
        [FromQuery] Guid? patientId = null,
        [FromQuery] StudyOrderStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _orderService.GetAllAsync(patientId, status, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StudyOrderDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _orderService.GetByIdAsync(id, cancellationToken);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StudyOrderDto>>> Create([FromBody] CreateStudyOrderDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.CreateAsync(dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<StudyOrderDto>>> UpdateStatus(Guid id, [FromBody] UpdateStudyOrderStatusDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.UpdateStatusAsync(id, dto.Status, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id:guid}/results")]
    [Authorize(Roles = "Admin,Laboratorist")]
    public async Task<ActionResult<ApiResponse<StudyOrderDto>>> SaveResults(Guid id, [FromBody] SaveStudyResultsDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.SaveResultsAsync(id, dto, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StudyOrderDto>>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var result = await _orderService.UpdateStatusAsync(id, StudyOrderStatus.Cancelled, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
