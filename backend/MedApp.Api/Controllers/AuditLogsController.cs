using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Policy = "RequireAdminRole")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AuditLogsController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedAuditLogsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogFilterDto filter)
    {
        var result = await _auditService.GetAuditLogsAsync(filter);
        return Ok(ApiResponse<PagedAuditLogsDto>.Ok(result));
    }

    [HttpGet("modules")]
    [ProducesResponseType(typeof(ApiResponse<List<string>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetModules()
    {
        var list = await _auditService.GetModulesAsync();
        return Ok(ApiResponse<List<string>>.Ok(list));
    }

    [HttpGet("actions")]
    [ProducesResponseType(typeof(ApiResponse<List<string>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActions()
    {
        var list = await _auditService.GetActionsAsync();
        return Ok(ApiResponse<List<string>>.Ok(list));
    }
}
