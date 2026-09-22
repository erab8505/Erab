using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<EmployeeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmployees([FromQuery] Guid? specialtyId, [FromQuery] bool onlyActive = true)
    {
        var result = await _employeeService.GetEmployeesAsync(specialtyId, onlyActive);
        return Ok(ApiResponse<List<EmployeeDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmployeeById(Guid id)
    {
        var result = await _employeeService.GetEmployeeByIdAsync(id);
        return Ok(ApiResponse<EmployeeDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
    {
        var created = await _employeeService.CreateEmployeeAsync(dto);
        return CreatedAtAction(nameof(GetEmployeeById), new { id = created.Id },
            ApiResponse<EmployeeDto>.Ok(created, "Colaborador registrado exitosamente."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeDto dto)
    {
        var updated = await _employeeService.UpdateEmployeeAsync(id, dto);
        return Ok(ApiResponse<EmployeeDto>.Ok(updated, "Colaborador actualizado exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteEmployee(Guid id)
    {
        await _employeeService.DeleteEmployeeAsync(id);
        return Ok(ApiResponse.Ok("Colaborador eliminado exitosamente."));
    }

    [HttpGet("{id:guid}/availability")]
    [ProducesResponseType(typeof(ApiResponse<List<EmployeeAvailabilityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailabilities(Guid id)
    {
        var result = await _employeeService.GetEmployeeAvailabilitiesAsync(id);
        return Ok(ApiResponse<List<EmployeeAvailabilityDto>>.Ok(result));
    }

    [HttpPut("{id:guid}/availability")]
    [ProducesResponseType(typeof(ApiResponse<List<EmployeeAvailabilityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetAvailabilities(Guid id, [FromBody] List<SetEmployeeAvailabilityDto> availabilities)
    {
        var result = await _employeeService.SetEmployeeAvailabilitiesAsync(id, availabilities);
        return Ok(ApiResponse<List<EmployeeAvailabilityDto>>.Ok(result, "Horarios de atención actualizados exitosamente."));
    }

    [HttpGet("{id:guid}/slots")]
    [ProducesResponseType(typeof(ApiResponse<List<TimeSlotDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSlots(Guid id, [FromQuery] string date, [FromQuery] int durationMinutes = 30)
    {
        if (!DateOnly.TryParse(date, out var parsedDate))
        {
            return BadRequest(ApiResponse.Fail("Formato de fecha inválido. Utilice el formato YYYY-MM-DD."));
        }

        var result = await _employeeService.GetAvailableSlotsAsync(id, parsedDate, durationMinutes);
        return Ok(ApiResponse<List<TimeSlotDto>>.Ok(result));
    }
}
