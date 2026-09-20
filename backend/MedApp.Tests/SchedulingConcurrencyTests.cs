using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Tests.Infrastructure;
using Xunit;

namespace MedApp.Tests;

public class SchedulingConcurrencyTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SchedulingConcurrencyTests(CustomWebApplicationFactory factory)
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

        return result.Data!.Token;
    }

    [Fact]
    public async Task CreateBooking_WithOverlappingInterval_Returns409Conflict()
    {
        // Arrange
        var token = await AuthenticateAsync("receptionist_test", "ReceptTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var patientId = _factory.Patient1Id;
        var interventionId = _factory.InterventionId;
        var futureDate = DateTimeOffset.UtcNow.AddDays(7).Date.AddHours(10); // 10:00 AM in 7 days

        // Act 1: Book initial appointment (10:00 - 10:30)
        var firstBooking = await _client.PostAsJsonAsync("/api/scheduling", new CreateSchedulingDto(
            patientId, _factory.SpecialistProfileId, interventionId, futureDate, 30, "Primera consulta"
        ));

        // Assert 1: First booking succeeds
        firstBooking.StatusCode.Should().Be(HttpStatusCode.Created);

        // Act 2: Attempt overlapping booking for the same specialist (10:15 - 10:45)
        var overlappingDate = futureDate.AddMinutes(15);
        var conflictingBooking = await _client.PostAsJsonAsync("/api/scheduling", new CreateSchedulingDto(
            patientId, _factory.SpecialistProfileId, interventionId, overlappingDate, 30, "Consulta en conflicto"
        ));

        // Assert 2: Must be rejected with 409 Conflict
        conflictingBooking.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var errorResult = await conflictingBooking.Content.ReadFromJsonAsync<ApiResponse>();
        errorResult.Should().NotBeNull();
        errorResult!.Success.Should().BeFalse();
        errorResult.Message.Should().Contain("solapa");
    }
}
