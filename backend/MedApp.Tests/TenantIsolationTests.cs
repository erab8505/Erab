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
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<PatientDto>>>();
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
}
