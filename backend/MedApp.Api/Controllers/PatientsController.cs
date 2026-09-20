using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientsController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<PatientDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPatients([FromQuery] string? query)
    {
        var patients = await _patientService.SearchPatientsAsync(query);
        return Ok(ApiResponse<List<PatientDto>>.Ok(patients));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPatientById(Guid id)
    {
        var patient = await _patientService.GetPatientByIdAsync(id);
        return Ok(ApiResponse<PatientDto>.Ok(patient));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreatePatient([FromBody] CreatePatientDto dto)
    {
        var created = await _patientService.CreatePatientAsync(dto);
        return CreatedAtAction(nameof(GetPatientById), new { id = created.Id },
            ApiResponse<PatientDto>.Ok(created, "Paciente registrado exitosamente."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdatePatient(Guid id, [FromBody] UpdatePatientDto dto)
    {
        var updated = await _patientService.UpdatePatientAsync(id, dto);
        return Ok(ApiResponse<PatientDto>.Ok(updated, "Datos del paciente actualizados exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeletePatient(Guid id)
    {
        await _patientService.DeletePatientAsync(id);
        return Ok(ApiResponse.Ok("Paciente eliminado exitosamente."));
    }
}
