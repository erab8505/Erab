using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IInterventionTypeService
{
    Task<List<InterventionTypeDto>> GetInterventionTypesAsync(Guid? specialtyId = null, bool? activeOnly = null);
    Task<InterventionTypeDto> GetInterventionTypeByIdAsync(Guid id);
    Task<InterventionTypeDto> CreateInterventionTypeAsync(CreateInterventionTypeDto dto);
    Task<InterventionTypeDto> UpdateInterventionTypeAsync(Guid id, UpdateInterventionTypeDto dto);
    Task<bool> DeleteInterventionTypeAsync(Guid id);
}
