using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Domain.Enums;
using MedApp.Tests.Infrastructure;
using Xunit;

namespace MedApp.Tests;

public class ReceptionistAndAuditTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ReceptionistAndAuditTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsync(string username, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(username, password));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResponseDto>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();

        return result.Data!.Token;
    }

    [Fact]
    public async Task CreateAndGetEmployee_ShouldSucceed_AndGenerateAuditLog()
    {
        // Arrange
        var token = await AuthenticateAsync("admin_test", "AdminTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var jsonOptions = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        jsonOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

        var createDto = new CreateEmployeeDto(
            FirstName: "Laura",
            LastName: "Vargas",
            IdentificationNumber: "EMP-1001",
            LicenseNumber: null,
            SpecialtyId: null,
            JobTitle: "Recepcionista Principal",
            Email: "laura.vargas@clinica.com",
            Phone: "555-4321",
            IsActive: true
        );

        // Act 1: Create Employee
        var createResponse = await _client.PostAsJsonAsync("/api/employees", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdResult = await createResponse.Content.ReadFromJsonAsync<ApiResponse<EmployeeDto>>(jsonOptions);
        createdResult.Should().NotBeNull();
        createdResult!.Success.Should().BeTrue();
        var employee = createdResult.Data;
        employee.Should().NotBeNull();
        employee!.FirstName.Should().Be("Laura");
        employee.LastName.Should().Be("Vargas");
        employee.FullName.Should().Be("Laura Vargas");

        // Act 2: Create User linked to this Employee
        var createUserDto = new CreateUserDto(
            Username: "laura_vargas_user",
            Password: "Password123!",
            Roles: new List<UserRole> { UserRole.Receptionist },
            EmployeeId: employee.Id,
            CompanyIds: new List<Guid> { _factory.Company1Id }
        );

        var userResponse = await _client.PostAsJsonAsync("/api/users", createUserDto);
        userResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var userResult = await userResponse.Content.ReadFromJsonAsync<ApiResponse<UserDto>>(jsonOptions);
        userResult.Should().NotBeNull();
        userResult!.Success.Should().BeTrue();
        userResult.Data!.EmployeeId.Should().Be(employee.Id);
        userResult.Data.EmployeeName.Should().Be("Laura Vargas");
        userResult.Data.Roles.Should().Contain(UserRole.Receptionist);

        // Act 3: Verify Audit Logs contain entries for Employees and Users
        var auditResponse = await _client.GetAsync("/api/audit-logs?module=Employees");
        auditResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var auditResult = await auditResponse.Content.ReadFromJsonAsync<ApiResponse<PagedAuditLogsDto>>(jsonOptions);
        auditResult.Should().NotBeNull();
        auditResult!.Success.Should().BeTrue();
        auditResult.Data.Should().NotBeNull();
        auditResult.Data!.Items.Should().Contain(a => a.Module == "Employees" && a.Action == "CREATE" && a.Description.Contains("Laura Vargas"));
    }

    [Fact]
    public async Task AuditLogs_CanFilterByRoleAndModule()
    {
        // Arrange: Login as SuperAdmin
        var token = await AuthenticateAsync("admin_test", "AdminTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var jsonOptions = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        jsonOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

        // Act: Query audit logs
        var response = await _client.GetAsync("/api/audit-logs?role=SuperAdmin");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<PagedAuditLogsDto>>(jsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Items.Should().OnlyContain(a => a.UserRole == UserRole.SuperAdmin);
    }

    [Fact]
    public async Task CreateAndUpdateUser_WithMultipleRoles_ShouldSucceed()
    {
        // Arrange
        var token = await AuthenticateAsync("admin_test", "AdminTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var jsonOptions = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        jsonOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

        // Act 1: Create user with 2 roles (Specialist + Receptionist)
        var createDto = new CreateUserDto(
            Username: "multi_role_user",
            Password: "Password123!",
            Roles: new List<UserRole> { UserRole.Specialist, UserRole.Receptionist },
            EmployeeId: _factory.SpecialistProfileId,
            CompanyIds: new List<Guid> { _factory.Company1Id }
        );

        var createResponse = await _client.PostAsJsonAsync("/api/users", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createResult = await createResponse.Content.ReadFromJsonAsync<ApiResponse<UserDto>>(jsonOptions);
        createResult!.Data!.Roles.Should().HaveCount(2);
        createResult.Data.Roles.Should().Contain(UserRole.Specialist);
        createResult.Data.Roles.Should().Contain(UserRole.Receptionist);

        // Act 2: Update user adding a 3rd role (Admin) and keeping previous
        var updateDto = new UpdateUserDto(
            Password: null,
            Roles: new List<UserRole> { UserRole.Specialist, UserRole.Receptionist, UserRole.Admin },
            EmployeeId: _factory.SpecialistProfileId,
            CompanyIds: new List<Guid> { _factory.Company1Id }
        );

        var updateResponse = await _client.PutAsJsonAsync($"/api/users/{createResult.Data.Id}", updateDto);
        var errorContent = await updateResponse.Content.ReadAsStringAsync();
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK, because: errorContent);

        var updateResult = await updateResponse.Content.ReadFromJsonAsync<ApiResponse<UserDto>>(jsonOptions);
        updateResult!.Data!.Roles.Should().HaveCount(3);
        updateResult.Data.Roles.Should().Contain(UserRole.Specialist);
        updateResult.Data.Roles.Should().Contain(UserRole.Receptionist);
        updateResult.Data.Roles.Should().Contain(UserRole.Admin);
    }
}
