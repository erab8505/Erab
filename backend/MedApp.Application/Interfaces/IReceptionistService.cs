using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IReceptionistService
{
    Task<List<ReceptionistDto>> GetReceptionistsAsync(bool? activeOnly = null);
    Task<ReceptionistDto> GetReceptionistByIdAsync(Guid id);
    Task<ReceptionistDto> CreateReceptionistAsync(CreateReceptionistDto dto);
    Task<ReceptionistDto> UpdateReceptionistAsync(Guid id, UpdateReceptionistDto dto);
    Task<bool> DeleteReceptionistAsync(Guid id);
}
