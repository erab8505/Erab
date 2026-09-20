using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Tests.Infrastructure;
using Xunit;

namespace MedApp.Tests;

public class ClinicalAuthorizationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ClinicalAuthorizationTests(CustomWebApplicationFactory factory)
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
    public async Task Receptionist_AccessingClinicalEndpoints_Returns403Forbidden()
    {
        // Arrange
        var token = await AuthenticateAsync("receptionist_test", "ReceptTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var patientId = _factory.Patient1Id;

        // Act: Try to query medical records
        var getResponse = await _client.GetAsync($"/api/medical-records?patientId={patientId}");

        // Assert
        getResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Act: Try to create medical record
        var postRecord = await _client.PostAsJsonAsync("/api/medical-records", new CreateMedicalRecordDto(
            patientId, null, DateTimeOffset.UtcNow, "Hipertensión", "Enalapril", null, 75.5m, 172m, 36.5m, 120, 80, 72, 98
        ));
        postRecord.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Act: Try to issue prescription
        var postPrescription = await _client.PostAsJsonAsync("/api/prescriptions", new CreatePrescriptionDto(
            patientId, null, _factory.SpecialistProfileId, DateTimeOffset.UtcNow, null,
            new List<CreatePrescriptionItemDto>
            {
                new("Enalapril", "10mg", "Cada 12 horas", 30, "Vía oral con alimentos")
            }
        ));
        postPrescription.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Specialist_CanCreateMedicalRecord_AndPrescriptionWithMultiItems()
    {
        // Arrange
        var token = await AuthenticateAsync("specialist_test", "SpecTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var patientId = _factory.Patient1Id;

        // Act 1: Create Medical Record with vital signs
        var createRecordResponse = await _client.PostAsJsonAsync("/api/medical-records", new CreateMedicalRecordDto(
            patientId, null, DateTimeOffset.UtcNow, "Evaluación cardiológica rutinaria",
            "Dieta baja en sodio y control en 3 meses", "Paciente asintomático",
            78.5m, 175.0m, 36.6m, 120, 80, 68, 99
        ));

        // Assert 1
        createRecordResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var recordResult = await createRecordResponse.Content.ReadFromJsonAsync<ApiResponse<MedicalRecordDto>>();
        recordResult.Should().NotBeNull();
        recordResult!.Success.Should().BeTrue();
        recordResult.Data!.SystolicBP.Should().Be(120);
        recordResult.Data.WeightKg.Should().Be(78.5m);

        // Act 2: Create Prescription with 2 items
        var createPrescriptionResponse = await _client.PostAsJsonAsync("/api/prescriptions", new CreatePrescriptionDto(
            patientId, recordResult.Data.Id, _factory.SpecialistProfileId, DateTimeOffset.UtcNow,
            "Tomar los medicamentos en horario estricto",
            new List<CreatePrescriptionItemDto>
            {
                new("Aspirina Protect", "100mg", "1 tableta al día", 30, "Vía oral después del desayuno"),
                new("Atorvastatina", "20mg", "1 tableta por la noche", 30, "Vía oral antes de dormir")
            }
        ));

        // Assert 2
        createPrescriptionResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var rxResult = await createPrescriptionResponse.Content.ReadFromJsonAsync<ApiResponse<PrescriptionDto>>();
        rxResult.Should().NotBeNull();
        rxResult!.Success.Should().BeTrue();
        rxResult.Data!.Items.Should().HaveCount(2);
        rxResult.Data.Items.Should().Contain(i => i.MedicationName == "Aspirina Protect");
        rxResult.Data.Items.Should().Contain(i => i.MedicationName == "Atorvastatina");
    }
}
