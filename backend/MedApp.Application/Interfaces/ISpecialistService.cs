using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface ISpecialistService
{
    Task<List<SpecialistDto>> GetSpecialistsAsync(Guid? specialtyId = null, bool? activeOnly = null);
    Task<SpecialistDto> GetSpecialistByIdAsync(Guid id);
    Task<SpecialistDto> CreateSpecialistAsync(CreateSpecialistDto dto);
    Task<SpecialistDto> UpdateSpecialistAsync(Guid id, UpdateSpecialistDto dto);
    Task<bool> DeleteSpecialistAsync(Guid id);
}
