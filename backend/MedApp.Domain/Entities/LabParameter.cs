using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class LabParameter : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

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

    public ICollection<LabExamParameter> ExamParameters { get; set; } = new List<LabExamParameter>();
}
