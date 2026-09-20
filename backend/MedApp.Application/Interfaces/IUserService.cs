using MedApp.Application.DTOs;

namespace MedApp.Application.Interfaces;

public interface IUserService
{
    Task<List<UserDto>> GetUsersAsync();
    Task<UserDto> GetUserByIdAsync(Guid id);
    Task<UserDto> CreateUserAsync(CreateUserDto dto);
    Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto dto);
    Task<bool> DeleteUserAsync(Guid id);
}
