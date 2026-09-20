using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
}
