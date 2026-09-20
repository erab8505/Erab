using MedApp.Application.Common.Models;
using MedApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly MedAppDbContext _context;

    public HealthController(MedAppDbContext context)
    {
        _context = context;
    }

    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public IActionResult GetHealth()
    {
        return Ok(ApiResponse<object>.Ok(new
        {
            status = "Healthy",
            timestamp = DateTimeOffset.UtcNow,
            version = "1.0.0"
        }, "Servicio API operativo."));
    }

    [AllowAnonymous]
    [HttpGet("db")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetDbHealth()
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            if (canConnect)
            {
                return Ok(ApiResponse<object>.Ok(new
                {
                    database = "MSSQL",
                    status = "Connected",
                    timestamp = DateTimeOffset.UtcNow
                }, "Conexión a la base de datos Microsoft SQL Server establecida correctamente."));
            }

            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse.Fail("No se pudo conectar con la base de datos MSSQL."));
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse.Fail($"Error al verificar la base de datos: {ex.Message}"));
        }
    }
}
