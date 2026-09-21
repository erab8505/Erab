using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class LabExamParameter : BaseEntity
{
    public Guid LabExamId { get; set; }
    public LabExam LabExam { get; set; } = null!;

    public Guid LabParameterId { get; set; }
    public LabParameter LabParameter { get; set; } = null!;

    public int SortOrder { get; set; } = 0;
    
    // Optional overrides specific to this exam context
    public decimal? CustomReferenceMin { get; set; }
    public decimal? CustomReferenceMax { get; set; }
    public string? CustomReferenceText { get; set; }
}
