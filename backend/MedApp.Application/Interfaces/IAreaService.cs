using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IAreaService
{
    Task<List<AreaDto>> GetAreasAsync();
    Task<AreaDto> GetAreaByIdAsync(Guid id);
    Task<AreaDto> CreateAreaAsync(CreateAreaDto dto);
    Task<AreaDto> UpdateAreaAsync(Guid id, UpdateAreaDto dto);
    Task<bool> DeleteAreaAsync(Guid id);
}
