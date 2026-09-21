using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public class LabParameterDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public ParameterValueType ValueType { get; set; } = ParameterValueType.Numeric;
    public string ValueTypeName => ValueType.ToString();
    
    public decimal? DefaultReferenceMin { get; set; }
    public decimal? DefaultReferenceMax { get; set; }
    public string? DefaultReferenceText { get; set; }
    
    public string? DefaultReagentName { get; set; }
    public decimal? DefaultReagentQuantity { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
}

public class CreateLabParameterDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public ParameterValueType ValueType { get; set; } = ParameterValueType.Numeric;
    public decimal? DefaultReferenceMin { get; set; }
    public decimal? DefaultReferenceMax { get; set; }
    public string? DefaultReferenceText { get; set; }
    public string? DefaultReagentName { get; set; }
    public decimal? DefaultReagentQuantity { get; set; }
}

public class UpdateLabParameterDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public ParameterValueType ValueType { get; set; } = ParameterValueType.Numeric;
    public decimal? DefaultReferenceMin { get; set; }
    public decimal? DefaultReferenceMax { get; set; }
    public string? DefaultReferenceText { get; set; }
    public string? DefaultReagentName { get; set; }
    public decimal? DefaultReagentQuantity { get; set; }
    public bool IsActive { get; set; } = true;
}
