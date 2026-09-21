using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Domain.Enums;

namespace MedApp.Application.Interfaces;

public interface IStudyOrderService
{
    Task<ApiResponse<List<StudyOrderDto>>> GetAllAsync(Guid? patientId = null, StudyOrderStatus? status = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudyOrderDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudyOrderDto>> CreateAsync(CreateStudyOrderDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudyOrderDto>> UpdateStatusAsync(Guid id, StudyOrderStatus status, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudyOrderDto>> SaveResultsAsync(Guid id, SaveStudyResultsDto dto, CancellationToken cancellationToken = default);
}
