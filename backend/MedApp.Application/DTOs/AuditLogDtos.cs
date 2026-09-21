using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public record AuditLogDto(
    Guid Id,
    Guid? CompanyId,
    string? CompanyName,
    Guid? UserId,
    string Username,
    UserRole UserRole,
    string Action,
    string Module,
    string? EntityId,
    string Description,
    string? DetailsJson,
    string? IpAddress,
    DateTimeOffset CreatedAt
);

public record AuditLogFilterDto(
    DateTimeOffset? FromDate = null,
    DateTimeOffset? ToDate = null,
    UserRole? Role = null,
    Guid? UserId = null,
    string? Module = null,
    string? Action = null,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 50
);

public record PagedAuditLogsDto(
    List<AuditLogDto> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages
);
