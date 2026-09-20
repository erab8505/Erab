using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchedulingController : ControllerBase
{
    private readonly ISchedulingService _schedulingService;

    public SchedulingController(ISchedulingService schedulingService)
    {
        _schedulingService = schedulingService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<SchedulingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSchedulings(
        [FromQuery] DateTimeOffset? fromDate,
        [FromQuery] DateTimeOffset? toDate,
        [FromQuery] Guid? specialistId,
        [FromQuery] Guid? patientId,
        [FromQuery] AppointmentStatus? status)
    {
        var schedulings = await _schedulingService.GetSchedulingsAsync(
            fromDate, toDate, specialistId, patientId, status);
        return Ok(ApiResponse<List<SchedulingDto>>.Ok(schedulings));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<SchedulingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSchedulingById(Guid id)
    {
        var scheduling = await _schedulingService.GetSchedulingByIdAsync(id);
        return Ok(ApiResponse<SchedulingDto>.Ok(scheduling));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<SchedulingDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateScheduling([FromBody] CreateSchedulingDto dto)
    {
        var created = await _schedulingService.CreateSchedulingAsync(dto);
        return CreatedAtAction(nameof(GetSchedulingById), new { id = created.Id },
            ApiResponse<SchedulingDto>.Ok(created, "Cita médica agendada exitosamente."));
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<SchedulingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateSchedulingStatusDto dto)
    {
        var updated = await _schedulingService.UpdateStatusAsync(id, dto);
        return Ok(ApiResponse<SchedulingDto>.Ok(updated, "Estado de la cita actualizado exitosamente."));
    }

    [HttpPatch("{id:guid}/reschedule")]
    [ProducesResponseType(typeof(ApiResponse<SchedulingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reschedule(Guid id, [FromBody] RescheduleDto dto)
    {
        var updated = await _schedulingService.RescheduleAsync(id, dto);
        return Ok(ApiResponse<SchedulingDto>.Ok(updated, "Cita médica reagendada exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteScheduling(Guid id)
    {
        await _schedulingService.DeleteSchedulingAsync(id);
        return Ok(ApiResponse.Ok("Cita médica eliminada exitosamente."));
    }
}
