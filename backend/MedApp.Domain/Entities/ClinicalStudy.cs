using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class ClinicalStudy : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public StudyCategory Category { get; set; } = StudyCategory.Laboratory;
    public decimal BasePrice { get; set; }
    public string? PreparationInstructions { get; set; }
    public int? TurnaroundTimeHours { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<ClinicalStudyExam> StudyExams { get; set; } = new List<ClinicalStudyExam>();
}
