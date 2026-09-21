using System.Text.Json;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedApp.Application.Services;

public class AuditService : IAuditService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICompanyContext _companyContext;
    private readonly ILogger<AuditService> _logger;

    public AuditService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ICompanyContext companyContext,
        ILogger<AuditService> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _companyContext = companyContext;
        _logger = logger;
    }

    public async Task LogAsync(
        string action,
        string module,
        string? entityId,
        string description,
        object? details = null,
        Guid? overrideCompanyId = null)
    {
        try
        {
            var companyId = overrideCompanyId ?? _companyContext.CompanyId;
            var userId = _currentUserService.UserId;
            var username = _currentUserService.Username ?? "Sistema";
            
            // Try parse user role or default
            UserRole userRole = UserRole.Receptionist;
            if (!string.IsNullOrWhiteSpace(_currentUserService.Role) &&
                Enum.TryParse<UserRole>(_currentUserService.Role, true, out var parsedRole))
            {
                userRole = parsedRole;
            }

            string? detailsJson = null;
            if (details != null)
            {
                if (details is string str)
                {
                    detailsJson = str;
                }
                else
                {
                    detailsJson = JsonSerializer.Serialize(details, new JsonSerializerOptions
                    {
                        WriteIndented = false,
                        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
                        ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
                    });
                }
            }

            var log = new AuditLog
            {
                CompanyId = companyId,
                UserId = userId,
                Username = username,
                UserRole = userRole,
                Action = action,
                Module = module,
                EntityId = entityId,
                Description = description,
                DetailsJson = detailsJson
            };

            await _context.AuditLogs.AddAsync(log);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al registrar evento de auditoría para módulo {Module}, acción {Action}", module, action);
        }
    }

    public async Task<PagedAuditLogsDto> GetAuditLogsAsync(AuditLogFilterDto filter)
    {
        var query = _context.AuditLogs
            .Include(a => a.Company)
            .AsNoTracking()
            .AsQueryable();

        // Multi-tenant check: if not SuperAdmin, restrict to current company or user companies
        if (!_currentUserService.IsSuperAdmin)
        {
            if (_companyContext.CompanyId.HasValue)
            {
                var compId = _companyContext.CompanyId.Value;
                query = query.Where(a => a.CompanyId == compId);
            }
            else if (_currentUserService.UserId.HasValue)
            {
                var myCompanyIds = await _context.UserCompanies
                    .Where(uc => uc.UserId == _currentUserService.UserId.Value)
                    .Select(uc => uc.CompanyId)
                    .ToListAsync();

                query = query.Where(a => a.CompanyId.HasValue && myCompanyIds.Contains(a.CompanyId.Value));
            }
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= filter.ToDate.Value);
        }

        if (filter.Role.HasValue)
        {
            query = query.Where(a => a.UserRole == filter.Role.Value);
        }

        if (filter.UserId.HasValue)
        {
            query = query.Where(a => a.UserId == filter.UserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Module))
        {
            var mod = filter.Module.Trim().ToLower();
            query = query.Where(a => a.Module.ToLower() == mod);
        }

        if (!string.IsNullOrWhiteSpace(filter.Action))
        {
            var act = filter.Action.Trim().ToLower();
            query = query.Where(a => a.Action.ToLower() == act);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(a =>
                a.Username.ToLower().Contains(search) ||
                a.Description.ToLower().Contains(search) ||
                (a.EntityId != null && a.EntityId.ToLower().Contains(search)) ||
                (a.DetailsJson != null && a.DetailsJson.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync();
        var pageNumber = filter.PageNumber <= 0 ? 1 : filter.PageNumber;
        var pageSize = filter.PageSize <= 0 ? 50 : filter.PageSize;
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto(
                a.Id,
                a.CompanyId,
                a.Company != null ? a.Company.Name : null,
                a.UserId,
                a.Username,
                a.UserRole,
                a.Action,
                a.Module,
                a.EntityId,
                a.Description,
                a.DetailsJson,
                a.IpAddress,
                a.CreatedAt
            ))
            .ToListAsync();

        return new PagedAuditLogsDto(items, totalCount, pageNumber, pageSize, totalPages);
    }

    public async Task<List<string>> GetModulesAsync()
    {
        return await _context.AuditLogs
            .Select(a => a.Module)
            .Distinct()
            .OrderBy(m => m)
            .ToListAsync();
    }

    public async Task<List<string>> GetActionsAsync()
    {
        return await _context.AuditLogs
            .Select(a => a.Action)
            .Distinct()
            .OrderBy(a => a)
            .ToListAsync();
    }
}
