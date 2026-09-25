using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using MedApp.Application.Common.Models;
using MedApp.Application.DTOs;
using MedApp.Domain.Constants;
using MedApp.Domain.Enums;
using MedApp.Tests.Infrastructure;
using Xunit;

namespace MedApp.Tests;

public class CompanyFeaturesTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly System.Text.Json.JsonSerializerOptions _jsonOptions;

    public CompanyFeaturesTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _jsonOptions = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        _jsonOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
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
    public async Task GetAllCompanies_ReturnsFeaturesDictionary()
    {
        // Arrange
        var token = await AuthenticateAsync("admin_test", "AdminTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        // Act
        var response = await _client.GetAsync("/api/companies");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<CompanyDto>>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeEmpty();

        var company1 = result.Data!.FirstOrDefault(c => c.Id == _factory.Company1Id);
        company1.Should().NotBeNull();
        company1!.Features.Should().NotBeNull();
        company1.Features!.Should().ContainKey(CompanyFeatureKeys.ModuleScheduling);
        company1.Features![CompanyFeatureKeys.ModuleScheduling].Should().BeTrue();
        company1.Features![CompanyFeatureKeys.ModuleLaboratory].Should().BeTrue();
        company1.Features![CompanyFeatureKeys.AllowReceptionistStudyOrders].Should().BeTrue();

        var company2 = result.Data!.FirstOrDefault(c => c.Id == _factory.Company2Id);
        company2.Should().NotBeNull();
        company2!.Features.Should().NotBeNull();
        company2.Features![CompanyFeatureKeys.ModuleLaboratory].Should().BeFalse();
    }

    [Fact]
    public async Task Receptionist_InCompanyWithLabAndPermission_CanCreateStudyOrder()
    {
        // Arrange: Receptionist in Company 1 where Lab=true and AllowReceptionist=true
        var token = await AuthenticateAsync("receptionist_test", "ReceptTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var dto = new CreateStudyOrderDto
        {
            PatientId = _factory.Patient1Id,
            ClinicalDiagnosis = "Chequeo de rutina ambulatorio",
            Notes = "Orden emitida desde mostrador",
            ClinicalStudyIds = new List<Guid> { _factory.ClinicalStudy1Id }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/study-orders", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<StudyOrderDto>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.PatientId.Should().Be(_factory.Patient1Id);
        result.Data.TotalAmount.Should().Be(25.0m);
    }

    [Fact]
    public async Task Receptionist_InCompanyWithoutLab_CannotCreateStudyOrder()
    {
        // Arrange: Receptionist in Company 2 where Lab=false
        var token = await AuthenticateAsync("company2_user", "Comp2User123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company2Id.ToString());

        var dto = new CreateStudyOrderDto
        {
            PatientId = _factory.Patient2Id,
            ClinicalDiagnosis = "Intento sin módulo",
            ClinicalStudyIds = new List<Guid> { _factory.ClinicalStudy2Id }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/study-orders", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<StudyOrderDto>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Success.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("El módulo de laboratorio no está habilitado para esta empresa"));
    }

    [Fact]
    public async Task SuperAdmin_CanUpdateCompanyFeatures_AndTogglePermissions()
    {
        // Arrange
        var token = await AuthenticateAsync("admin_test", "AdminTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var updateDto = new UpdateCompanyDto(
            Name: "Hospital General Alfa Modificado",
            TaxId: "TAX-ALFA-01",
            Address: "Nueva Dirección",
            Phone: "555-9999",
            Email: "alfa@hospital.com",
            IsActive: true,
            Description: "Con features actualizados",
            Features: new Dictionary<string, bool>
            {
                [CompanyFeatureKeys.ModuleScheduling] = true,
                [CompanyFeatureKeys.ModuleLaboratory] = true,
                [CompanyFeatureKeys.AllowReceptionistStudyOrders] = false // Disable receptionist study creation
            }
        );

        // Act 1: Update Company 1 features
        var updateResponse = await _client.PutAsJsonAsync($"/api/companies/{_factory.Company1Id}", updateDto);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updateResult = await updateResponse.Content.ReadFromJsonAsync<ApiResponse<CompanyDto>>(_jsonOptions);
        updateResult.Should().NotBeNull();
        updateResult!.Data!.Features![CompanyFeatureKeys.AllowReceptionistStudyOrders].Should().BeFalse();

        // Act 2: Now Receptionist in Company 1 tries to create study order
        var recepToken = await AuthenticateAsync("receptionist_test", "ReceptTest123!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", recepToken);
        _client.DefaultRequestHeaders.Remove("X-Company-Id");
        _client.DefaultRequestHeaders.Add("X-Company-Id", _factory.Company1Id.ToString());

        var dto = new CreateStudyOrderDto
        {
            PatientId = _factory.Patient1Id,
            ClinicalDiagnosis = "Intento bloqueado",
            ClinicalStudyIds = new List<Guid> { _factory.ClinicalStudy1Id }
        };

        var postResponse = await _client.PostAsJsonAsync("/api/study-orders", dto);

        // Assert 2: Should be rejected because AllowReceptionistStudyOrders is now false
        postResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var postResult = await postResponse.Content.ReadFromJsonAsync<ApiResponse<StudyOrderDto>>(_jsonOptions);
        postResult.Should().NotBeNull();
        postResult!.Success.Should().BeFalse();
        postResult.Errors.Should().Contain(e => e.Contains("El rol de recepcionista no tiene permiso para crear órdenes de estudio"));

        // Cleanup: Restore AllowReceptionistStudyOrders to true for Company 1
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var restoreDto = updateDto with
        {
            Features = new Dictionary<string, bool>
            {
                [CompanyFeatureKeys.ModuleScheduling] = true,
                [CompanyFeatureKeys.ModuleLaboratory] = true,
                [CompanyFeatureKeys.AllowReceptionistStudyOrders] = true
            }
        };
        await _client.PutAsJsonAsync($"/api/companies/{_factory.Company1Id}", restoreDto);
    }
}
