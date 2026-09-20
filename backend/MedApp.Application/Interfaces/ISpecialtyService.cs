using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface ISpecialtyService
{
    Task<List<SpecialtyDto>> GetSpecialtiesAsync(Guid? areaId = null);
    Task<SpecialtyDto> GetSpecialtyByIdAsync(Guid id);
    Task<SpecialtyDto> CreateSpecialtyAsync(CreateSpecialtyDto dto);
    Task<SpecialtyDto> UpdateSpecialtyAsync(Guid id, UpdateSpecialtyDto dto);
    Task<bool> DeleteSpecialtyAsync(Guid id);
}
