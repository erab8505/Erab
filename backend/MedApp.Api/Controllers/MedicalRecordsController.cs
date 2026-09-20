using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize(Policy = "RequireClinicalRole")]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _medicalRecordService;

    public MedicalRecordsController(IMedicalRecordService medicalRecordService)
    {
        _medicalRecordService = medicalRecordService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<MedicalRecordDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMedicalRecords([FromQuery] Guid patientId)
    {
        if (patientId == Guid.Empty)
            return BadRequest(ApiResponse.Fail("El parámetro patientId es obligatorio."));

        var records = await _medicalRecordService.GetMedicalRecordsByPatientAsync(patientId);
        return Ok(ApiResponse<List<MedicalRecordDto>>.Ok(records));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMedicalRecordById(Guid id)
    {
        var record = await _medicalRecordService.GetMedicalRecordByIdAsync(id);
        return Ok(ApiResponse<MedicalRecordDto>.Ok(record));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateMedicalRecord([FromBody] CreateMedicalRecordDto dto)
    {
        var created = await _medicalRecordService.CreateMedicalRecordAsync(dto);
        return CreatedAtAction(nameof(GetMedicalRecordById), new { id = created.Id },
            ApiResponse<MedicalRecordDto>.Ok(created, "Nota médica e historia clínica registrada exitosamente."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MedicalRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMedicalRecord(Guid id, [FromBody] UpdateMedicalRecordDto dto)
    {
        var updated = await _medicalRecordService.UpdateMedicalRecordAsync(id, dto);
        return Ok(ApiResponse<MedicalRecordDto>.Ok(updated, "Historia médica actualizada exitosamente."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteMedicalRecord(Guid id)
    {
        await _medicalRecordService.DeleteMedicalRecordAsync(id);
        return Ok(ApiResponse.Ok("Historia médica eliminada exitosamente."));
    }
}
