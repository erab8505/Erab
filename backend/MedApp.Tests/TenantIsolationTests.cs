using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Tests.Infrastructure;
using Xunit;

namespace MedApp.Tests;

public class TenantIsolationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public TenantIsolationTests(CustomWebApplicationFactory factory)
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
    public async Task QueryPatients_WithCompany1Context_ReturnsOnlyCompany1Patients()
    {
        // Arrange
        var token = await AuthenticateAsync("receptionist_test", "ReceptTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        // Act
        var response = await _client.GetAsync("/api/patients");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonOptions = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        jsonOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<PatientDto>>>(jsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();

        // Should contain Juan Pérez (Company 1) and NOT María López (Company 2)
        result.Data!.Should().ContainSingle(p => p.DocumentId == "DOC-12345");
        result.Data.Should().NotContain(p => p.DocumentId == "DOC-99999");
    }

    [Fact]
    public async Task NonAdmin_AccessingUnassignedCompany_Returns403Forbidden()
    {
        // Arrange: receptionist is assigned to Company 1, attempts to access Company 2
        var token = await AuthenticateAsync("receptionist_test", "ReceptTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company2Id.ToString());

        // Act
        var response = await _client.GetAsync("/api/patients");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CompanyAdmin_AccessingUnassignedCompany_Returns403Forbidden()
    {
        // Arrange: company_admin_test is assigned ONLY to Company 1, attempts to access Company 2
        var token = await AuthenticateAsync("company_admin_test", "CompAdmin123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company2Id.ToString());

        // Act
        var response = await _client.GetAsync("/api/patients");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CompanyAdmin_AccessingCompaniesCatalog_Returns403Forbidden()
    {
        // Arrange: company_admin_test tries to get/manage global companies
        var token = await AuthenticateAsync("company_admin_test", "CompAdmin123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");

        // Act
        var response = await _client.GetAsync("/api/companies");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task SuperAdmin_AccessingAnyCompany_Returns200Ok()
    {
        // Arrange: SuperAdmin can access any company without restrictions
        var token = await AuthenticateAsync("admin_test", "AdminTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company2Id.ToString());

        // Act
        var response = await _client.GetAsync("/api/patients");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task SuperAdmin_AccessingCompaniesCatalog_Returns200Ok()
    {
        // Arrange: SuperAdmin can access global companies catalog
        var token = await AuthenticateAsync("admin_test", "AdminTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");

        // Act
        var response = await _client.GetAsync("/api/companies");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CompanyAdmin_QueryUsers_ReturnsOnlyUsersAssignedToTheirCompany()
    {
        // Arrange: company_admin_test belongs only to Company 1
        var token = await AuthenticateAsync("company_admin_test", "CompAdmin123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var jsonOptions = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        jsonOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

        // Act
        var response = await _client.GetAsync("/api/users");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<UserDto>>>(jsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();

        // Should contain company_admin_test and receptionist_test (Company 1)
        result.Data!.Should().Contain(u => u.Username == "company_admin_test");
        result.Data.Should().Contain(u => u.Username == "receptionist_test");

        // Should NOT contain company2_user (Company 2 only)
        result.Data.Should().NotContain(u => u.Username == "company2_user");
    }

    [Fact]
    public async Task SuperAdmin_QueryUsers_ReturnsAllUsersAcrossPlatform()
    {
        // Arrange: admin_test is SuperAdmin
        var token = await AuthenticateAsync("admin_test", "AdminTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");

        var jsonOptions = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        jsonOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

        // Act
        var response = await _client.GetAsync("/api/users");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<UserDto>>>(jsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();

        // Should contain all users across both companies
        result.Data!.Should().Contain(u => u.Username == "company_admin_test");
        result.Data.Should().Contain(u => u.Username == "company2_user");
        result.Data.Should().Contain(u => u.Username == "admin_test");
    }
}
