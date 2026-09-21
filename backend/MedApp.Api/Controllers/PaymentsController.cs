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
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<PaymentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayments(
        [FromQuery] DateTimeOffset? fromDate,
        [FromQuery] DateTimeOffset? toDate,
        [FromQuery] PaymentStatus? status,
        [FromQuery] Guid? patientId)
    {
        var payments = await _paymentService.GetPaymentsAsync(fromDate, toDate, status, patientId);
        return Ok(ApiResponse<List<PaymentDto>>.Ok(payments));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPaymentById(Guid id)
    {
        var payment = await _paymentService.GetPaymentByIdAsync(id);
        if (payment == null)
            return NotFound(ApiResponse.Fail("Registro de pago no encontrado."));

        return Ok(ApiResponse<PaymentDto>.Ok(payment));
    }

    [HttpGet("by-scheduling/{schedulingId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentBySchedulingId(Guid schedulingId)
    {
        var payment = await _paymentService.GetPaymentBySchedulingIdAsync(schedulingId);
        return Ok(ApiResponse<PaymentDto?>.Ok(payment));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto dto)
    {
        var created = await _paymentService.CreatePaymentAsync(dto);
        return CreatedAtAction(nameof(GetPaymentById), new { id = created.Id },
            ApiResponse<PaymentDto>.Ok(created, "Cobro registrado exitosamente."));
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdatePaymentStatus(Guid id, [FromBody] UpdatePaymentStatusDto dto)
    {
        var updated = await _paymentService.UpdatePaymentStatusAsync(id, dto);
        return Ok(ApiResponse<PaymentDto>.Ok(updated, "Estado de pago actualizado."));
    }

    [HttpGet("daily-summary")]
    [ProducesResponseType(typeof(ApiResponse<DailyCashSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDailySummary([FromQuery] DateTimeOffset? date)
    {
        var summary = await _paymentService.GetDailySummaryAsync(date);
        return Ok(ApiResponse<DailyCashSummaryDto>.Ok(summary));
    }
}
