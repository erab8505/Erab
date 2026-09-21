using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IAuditService
{
    Task LogAsync(string action, string module, string? entityId, string description, object? details = null, Guid? overrideCompanyId = null);
    Task<PagedAuditLogsDto> GetAuditLogsAsync(AuditLogFilterDto filter);
    Task<List<string>> GetModulesAsync();
    Task<List<string>> GetActionsAsync();
}
