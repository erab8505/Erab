using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class StudyOrderResult : BaseEntity
{
    public Guid StudyOrderItemId { get; set; }
    public StudyOrderItem StudyOrderItem { get; set; } = null!;

    public Guid LabExamId { get; set; }
    public LabExam LabExam { get; set; } = null!;

    public Guid LabParameterId { get; set; }
    public LabParameter LabParameter { get; set; } = null!;

    // Snapshots of analyte metadata at time of result
    public string ParameterCode { get; set; } = string.Empty;
    public string ParameterName { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public ParameterValueType ValueType { get; set; } = ParameterValueType.Numeric;

    // Captured values
    public decimal? NumericValue { get; set; }
    public string? TextValue { get; set; }

    // Reference snapshot
    public decimal? ReferenceRangeMin { get; set; }
    public decimal? ReferenceRangeMax { get; set; }
    public string? ReferenceText { get; set; }

    // Range analysis
    public bool IsOutOfRange { get; set; } = false;
    public string? AlertLevel { get; set; } // Normal, High, Low, Critical
    public string? Interpretation { get; set; }
    public string? TechnicianNotes { get; set; }
}
