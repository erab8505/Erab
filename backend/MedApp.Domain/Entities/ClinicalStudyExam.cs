using MedApp.Domain.Common;

namespace MedApp.Domain.Entities;

public class ClinicalStudyExam : BaseEntity
{
    public Guid ClinicalStudyId { get; set; }
    public ClinicalStudy ClinicalStudy { get; set; } = null!;

    public Guid LabExamId { get; set; }
    public LabExam LabExam { get; set; } = null!;

    public int SortOrder { get; set; } = 0;
}
