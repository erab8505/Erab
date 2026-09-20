namespace MedApp.Application.DTOs;

public record AreaDto(
    Guid Id,
    Guid CompanyId,
    string Name,
    string? Description,
    DateTimeOffset CreatedAt
);

public record CreateAreaDto(
    string Name,
    string? Description
);

public record UpdateAreaDto(
    string Name,
    string? Description
);
