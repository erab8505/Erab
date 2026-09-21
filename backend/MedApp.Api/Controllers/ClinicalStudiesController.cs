using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/clinical-studies")]
public class ClinicalStudiesController : ControllerBase
{
    private readonly IClinicalStudyService _studyService;

    public ClinicalStudiesController(IClinicalStudyService studyService)
    {
        _studyService = studyService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ClinicalStudyDto>>>> GetAll([FromQuery] StudyCategory? category = null, [FromQuery] bool? isActive = null)
    {
        var result = await _studyService.GetAllAsync(category, isActive);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ClinicalStudyDto>>> GetById(Guid id)
    {
        var result = await _studyService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ClinicalStudyDto>>> Create([FromBody] CreateClinicalStudyDto dto)
    {
        var result = await _studyService.CreateAsync(dto);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ClinicalStudyDto>>> Update(Guid id, [FromBody] UpdateClinicalStudyDto dto)
    {
        var result = await _studyService.UpdateAsync(id, dto);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse>> Delete(Guid id)
    {
        var result = await _studyService.DeleteAsync(id);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
