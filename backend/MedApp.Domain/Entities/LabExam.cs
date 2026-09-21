using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class LabExam : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SampleType SampleType { get; set; } = SampleType.VenousBlood;
    public string? Method { get; set; }
    public int? TurnaroundHours { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<LabExamParameter> Parameters { get; set; } = new List<LabExamParameter>();
    public ICollection<ClinicalStudyExam> StudyExams { get; set; } = new List<ClinicalStudyExam>();
}
