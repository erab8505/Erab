using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/patients/{patientId:guid}/documents")]
[Authorize(Roles = "Admin,Specialist,Receptionist")]
public class PatientDocumentsController : ControllerBase
{
    private readonly IPatientDocumentService _documentService;

    public PatientDocumentsController(IPatientDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<PatientDocumentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocuments(
        Guid patientId,
        [FromQuery] DocumentCategory? category)
    {
        var documents = await _documentService.GetDocumentsByPatientIdAsync(patientId, category);
        return Ok(ApiResponse<List<PatientDocumentDto>>.Ok(documents));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PatientDocumentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDocumentById(Guid patientId, Guid id)
    {
        var doc = await _documentService.GetDocumentByIdAsync(id);
        if (doc == null || doc.PatientId != patientId)
            return NotFound(ApiResponse.Fail("Documento no encontrado."));

        return Ok(ApiResponse<PatientDocumentDto>.Ok(doc));
    }

    [HttpPost]
    [RequestSizeLimit(30 * 1024 * 1024)] // 30 MB
    [ProducesResponseType(typeof(ApiResponse<PatientDocumentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadDocument(
        Guid patientId,
        [FromForm] IFormFile file,
        [FromForm] string? title,
        [FromForm] DocumentCategory category = DocumentCategory.Other,
        [FromForm] string? description = null,
        [FromForm] Guid? medicalRecordId = null)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse.Fail("Debe seleccionar un archivo válido."));
        }

        using var stream = file.OpenReadStream();
        var created = await _documentService.UploadDocumentAsync(
            patientId,
            title ?? file.FileName,
            category,
            description,
            medicalRecordId,
            file.FileName,
            file.ContentType,
            file.Length,
            stream);

        return CreatedAtAction(nameof(GetDocumentById), new { patientId, id = created.Id },
            ApiResponse<PatientDocumentDto>.Ok(created, "Archivo adjunto subido exitosamente."));
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadDocument(Guid patientId, Guid id)
    {
        var doc = await _documentService.GetDocumentByIdAsync(id);
        if (doc == null || doc.PatientId != patientId)
            return NotFound(ApiResponse.Fail("Documento no encontrado."));

        var (stream, contentType, fileName) = await _documentService.DownloadDocumentAsync(id);
        return File(stream, contentType, fileName);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteDocument(Guid patientId, Guid id)
    {
        var doc = await _documentService.GetDocumentByIdAsync(id);
        if (doc == null || doc.PatientId != patientId)
            return NotFound(ApiResponse.Fail("Documento no encontrado."));

        await _documentService.DeleteDocumentAsync(id);
        return Ok(ApiResponse.Ok("Documento eliminado exitosamente."));
    }
}
