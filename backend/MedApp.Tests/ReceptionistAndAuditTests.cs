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
    public async Task CreateAndGetReceptionist_ShouldSucceed_AndGenerateAuditLog()
    {
        // Arrange
        var token = await AuthenticateAsync("admin_test", "AdminTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var jsonOptions = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        jsonOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

        var createDto = new CreateReceptionistDto(
            FirstName: "Laura",
            LastName: "Vargas",
            IdentificationNumber: "REC-1001",
            Email: "laura.vargas@clinica.com",
            Phone: "555-4321",
            IsActive: true
        );

        // Act 1: Create Receptionist
        var createResponse = await _client.PostAsJsonAsync("/api/receptionists", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdResult = await createResponse.Content.ReadFromJsonAsync<ApiResponse<ReceptionistDto>>(jsonOptions);
        createdResult.Should().NotBeNull();
        createdResult!.Success.Should().BeTrue();
        var receptionist = createdResult.Data;
        receptionist.Should().NotBeNull();
        receptionist!.FirstName.Should().Be("Laura");
        receptionist.LastName.Should().Be("Vargas");
        receptionist.FullName.Should().Be("Laura Vargas");

        // Act 2: Create User linked to this Receptionist
        var createUserDto = new CreateUserDto(
            Username: "laura_vargas_user",
            Password: "Password123!",
            Role: UserRole.Receptionist,
            SpecialistId: null,
            ReceptionistId: receptionist.Id,
            CompanyIds: new List<Guid> { _factory.Company1Id }
        );

        var userResponse = await _client.PostAsJsonAsync("/api/users", createUserDto);
        userResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var userResult = await userResponse.Content.ReadFromJsonAsync<ApiResponse<UserDto>>(jsonOptions);
        userResult.Should().NotBeNull();
        userResult!.Success.Should().BeTrue();
        userResult.Data!.ReceptionistId.Should().Be(receptionist.Id);
        userResult.Data.ReceptionistName.Should().Be("Laura Vargas");

        // Act 3: Verify Audit Logs contain entries for Receptionists and Users
        var auditResponse = await _client.GetAsync("/api/audit-logs?module=Receptionists");
        auditResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var auditResult = await auditResponse.Content.ReadFromJsonAsync<ApiResponse<PagedAuditLogsDto>>(jsonOptions);
        auditResult.Should().NotBeNull();
        auditResult!.Success.Should().BeTrue();
        auditResult.Data.Should().NotBeNull();
        auditResult.Data!.Items.Should().Contain(a => a.Module == "Receptionists" && a.Action == "CREATE" && a.Description.Contains("Laura Vargas"));
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
}
