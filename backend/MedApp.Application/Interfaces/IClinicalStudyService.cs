using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Domain.Enums;

namespace MedApp.Application.Interfaces;

public interface IClinicalStudyService
{
    Task<ApiResponse<List<ClinicalStudyDto>>> GetAllAsync(StudyCategory? category = null, bool? isActive = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClinicalStudyDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClinicalStudyDto>> CreateAsync(CreateClinicalStudyDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClinicalStudyDto>> UpdateAsync(Guid id, UpdateClinicalStudyDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
