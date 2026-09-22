using System.Net;
using System.Text.Json;
using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Models;

namespace MedApp.Api.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred during request execution: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            ValidationAppException valEx => new
            {
                StatusCode = (int)HttpStatusCode.BadRequest,
                Envelope = ApiResponse.Fail(valEx.Message, valEx.Errors.SelectMany(kvp => kvp.Value))
            },
            FluentValidation.ValidationException fluentEx => new
            {
                StatusCode = (int)HttpStatusCode.BadRequest,
                Envelope = ApiResponse.Fail("Validation failed.", fluentEx.Errors.Select(e => e.ErrorMessage))
            },
            NotFoundException notFoundEx => new
            {
                StatusCode = (int)HttpStatusCode.NotFound,
                Envelope = ApiResponse.Fail(notFoundEx.Message)
            },
            KeyNotFoundException knfEx => new
            {
                StatusCode = (int)HttpStatusCode.NotFound,
                Envelope = ApiResponse.Fail(knfEx.Message)
            },
            ForbiddenAccessException forbEx => new
            {
                StatusCode = (int)HttpStatusCode.Forbidden,
                Envelope = ApiResponse.Fail(forbEx.Message)
            },
            UnauthorizedAccessException unauthEx => new
            {
                StatusCode = (int)HttpStatusCode.Unauthorized,
                Envelope = ApiResponse.Fail(unauthEx.Message)
            },
            ConflictException confEx => new
            {
                StatusCode = (int)HttpStatusCode.Conflict,
                Envelope = ApiResponse.Fail(confEx.Message)
            },
            ArgumentException argEx => new
            {
                StatusCode = (int)HttpStatusCode.BadRequest,
                Envelope = ApiResponse.Fail(argEx.Message)
            },
            _ => new
            {
                StatusCode = (int)HttpStatusCode.InternalServerError,
                Envelope = ApiResponse.Fail(exception.Message, new[] { exception.ToString() })
            }
        };

        context.Response.StatusCode = response.StatusCode;
        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response.Envelope, jsonOptions));
    }
}
