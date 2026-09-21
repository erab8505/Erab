using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface ILabExamService
{
    Task<ApiResponse<List<LabExamDto>>> GetAllAsync(string? search = null, bool? isActive = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<LabExamDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<LabExamDto>> CreateAsync(CreateLabExamDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<LabExamDto>> UpdateAsync(Guid id, UpdateLabExamDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
