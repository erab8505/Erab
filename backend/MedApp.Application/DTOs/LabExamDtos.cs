using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public class LabExamParameterItemDto
{
    public Guid Id { get; set; }
    public Guid LabParameterId { get; set; }
    public string ParameterCode { get; set; } = string.Empty;
    public string ParameterName { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public ParameterValueType ValueType { get; set; } = ParameterValueType.Numeric;
    public string ValueTypeName => ValueType.ToString();
    public int SortOrder { get; set; }

    public decimal? ReferenceRangeMin { get; set; }
    public decimal? ReferenceRangeMax { get; set; }
    public string? ReferenceText { get; set; }
    public string? ReagentName { get; set; }
    public decimal? ReagentQuantity { get; set; }
}

public class LabExamDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SampleType SampleType { get; set; } = SampleType.VenousBlood;
    public string SampleTypeName => SampleType.ToString();
    public string? Method { get; set; }
    public int? TurnaroundHours { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public List<LabExamParameterItemDto> Parameters { get; set; } = new();
}

public class CreateLabExamParameterDto
{
    public Guid LabParameterId { get; set; }
    public int SortOrder { get; set; }
    public decimal? CustomReferenceMin { get; set; }
    public decimal? CustomReferenceMax { get; set; }
    public string? CustomReferenceText { get; set; }
}

public class CreateLabExamDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SampleType SampleType { get; set; } = SampleType.VenousBlood;
    public string? Method { get; set; }
    public int? TurnaroundHours { get; set; }
    public List<CreateLabExamParameterDto> Parameters { get; set; } = new();
}

public class UpdateLabExamDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SampleType SampleType { get; set; } = SampleType.VenousBlood;
    public string? Method { get; set; }
    public int? TurnaroundHours { get; set; }
    public bool IsActive { get; set; } = true;
    public List<CreateLabExamParameterDto> Parameters { get; set; } = new();
}
