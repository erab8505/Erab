using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Domain.Enums;
using MedApp.Tests.Infrastructure;
using Xunit;

namespace MedApp.Tests;

public class SpecialistDataIsolationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SpecialistDataIsolationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsync(string username, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(username, password));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResponseDto>>(JsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();

        return result.Data!.Token;
    }

    private void SetHeaders(string token, Guid companyId)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", companyId.ToString());
    }

    [Fact]
    public async Task Specialist_GetSchedulings_ReturnsOnlyOwnAppointments()
    {
        // Arrange: Login as Specialist 1
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act: Get all appointments
        var response = await _client.GetAsync("/api/scheduling");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<SchedulingDto>>>(JsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();

        // Must contain Specialist 1 appointment and NOT Specialist 2 appointment
        result.Data.Should().Contain(s => s.Id == _factory.Specialist1SchedulingId);
        result.Data.Should().NotContain(s => s.Id == _factory.Specialist2SchedulingId);
        result.Data.Should().OnlyContain(s => s.SpecialistId == _factory.SpecialistProfileId);
    }

    [Fact]
    public async Task Specialist_GetSchedulings_WithOtherSpecialistIdQuery_StillReturnsOnlyOwnAppointments()
    {
        // Arrange: Login as Specialist 1
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act: Attempt to query Specialist 2's appointments
        var response = await _client.GetAsync($"/api/scheduling?specialistId={_factory.Specialist2ProfileId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<SchedulingDto>>>(JsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();

        // Must NEVER return Specialist 2 appointments
        result.Data.Should().NotContain(s => s.SpecialistId == _factory.Specialist2ProfileId);
    }

    [Fact]
    public async Task Specialist_GetSchedulingById_ForOtherSpecialist_ReturnsNotFound()
    {
        // Arrange: Login as Specialist 1
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act: Attempt to get Specialist 2's appointment by ID
        var response = await _client.GetAsync($"/api/scheduling/{_factory.Specialist2SchedulingId}");

        // Assert: 404 NotFound
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Specialist_UpdateStatus_ForOtherSpecialist_ReturnsForbidden()
    {
        // Arrange: Login as Specialist 1
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act: Attempt to modify status of Specialist 2's appointment
        var response = await _client.PatchAsJsonAsync($"/api/scheduling/{_factory.Specialist2SchedulingId}/status",
            new UpdateSchedulingStatusDto(AppointmentStatus.Confirmed));

        // Assert: 403 Forbidden
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Specialist_Reschedule_ForOtherSpecialist_ReturnsForbidden()
    {
        // Arrange: Login as Specialist 1
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act: Attempt to reschedule Specialist 2's appointment
        var response = await _client.PatchAsJsonAsync($"/api/scheduling/{_factory.Specialist2SchedulingId}/reschedule",
            new RescheduleDto(DateTimeOffset.UtcNow.AddDays(5), 30));

        // Assert: 403 Forbidden
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Specialist_GetSpecialists_ReturnsOnlyOwnProfile()
    {
        // Arrange: Login as Specialist 1
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act: Get employees list
        var response = await _client.GetAsync("/api/employees");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<EmployeeDto>>>(JsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();

        // Must contain only Specialist 1, not Specialist 2
        result.Data.Should().HaveCount(1);
        result.Data!.Single().Id.Should().Be(_factory.SpecialistProfileId);
        result.Data.Should().NotContain(s => s.Id == _factory.Specialist2ProfileId);
    }

    [Fact]
    public async Task Specialist_GetSpecialistById_ForOtherSpecialist_ReturnsNotFound()
    {
        // Arrange: Login as Specialist 1
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act: Query Specialist 2 by ID
        var response = await _client.GetAsync($"/api/employees/{_factory.Specialist2ProfileId}");

        // Assert: 404 NotFound
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Specialist_GetSpecialistAvailability_ForOtherSpecialist_ReturnsForbidden()
    {
        // Arrange: Login as Specialist 1
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act: Query Specialist 2 availability
        var response = await _client.GetAsync($"/api/employees/{_factory.Specialist2ProfileId}/availability");

        // Assert: 403 Forbidden
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Specialist_GetSpecialistSlots_ForOtherSpecialist_ReturnsForbidden()
    {
        // Arrange: Login as Specialist 1
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act: Query Specialist 2 slots
        var response = await _client.GetAsync($"/api/employees/{_factory.Specialist2ProfileId}/slots?date=2026-09-21");

        // Assert: 403 Forbidden
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Receptionist_CanAccessAllSpecialistsAndSchedulings()
    {
        // Arrange: Login as Receptionist
        var token = await AuthenticateAsync("receptionist_test", "ReceptTest123!");
        SetHeaders(token, _factory.Company1Id);

        // Act 1: Get employees
        var specResponse = await _client.GetAsync("/api/employees");
        specResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var specResult = await specResponse.Content.ReadFromJsonAsync<ApiResponse<List<EmployeeDto>>>(JsonOptions);
        specResult!.Data.Should().HaveCount(2);

        // Act 2: Get schedulings
        var schedResponse = await _client.GetAsync("/api/scheduling");
        schedResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var schedResult = await schedResponse.Content.ReadFromJsonAsync<ApiResponse<List<SchedulingDto>>>(JsonOptions);
        schedResult!.Data.Should().HaveCount(2);
    }
}
