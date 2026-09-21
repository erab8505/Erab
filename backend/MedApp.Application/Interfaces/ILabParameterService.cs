using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface ILabParameterService
{
    Task<ApiResponse<List<LabParameterDto>>> GetAllAsync(string? search = null, bool? isActive = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<LabParameterDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<LabParameterDto>> CreateAsync(CreateLabParameterDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<LabParameterDto>> UpdateAsync(Guid id, UpdateLabParameterDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
