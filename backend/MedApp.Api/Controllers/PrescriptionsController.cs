using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireClinicalRole")]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;

    public PrescriptionsController(IPrescriptionService prescriptionService)
    {
        _prescriptionService = prescriptionService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<PrescriptionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPrescriptions([FromQuery] Guid patientId)
    {
        if (patientId == Guid.Empty)
            return BadRequest(ApiResponse.Fail("El parámetro patientId es obligatorio."));

        var prescriptions = await _prescriptionService.GetPrescriptionsByPatientAsync(patientId);
        return Ok(ApiResponse<List<PrescriptionDto>>.Ok(prescriptions));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPrescriptionById(Guid id)
    {
        var prescription = await _prescriptionService.GetPrescriptionByIdAsync(id);
        return Ok(ApiResponse<PrescriptionDto>.Ok(prescription));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreatePrescription([FromBody] CreatePrescriptionDto dto)
    {
        var created = await _prescriptionService.CreatePrescriptionAsync(dto);
        return CreatedAtAction(nameof(GetPrescriptionById), new { id = created.Id },
            ApiResponse<PrescriptionDto>.Ok(created, "Receta médica emitida exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePrescription(Guid id)
    {
        await _prescriptionService.DeletePrescriptionAsync(id);
        return Ok(ApiResponse.Ok("Receta médica eliminada exitosamente."));
    }
}
