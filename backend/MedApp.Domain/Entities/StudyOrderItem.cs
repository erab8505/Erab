using MedApp.Domain.Common;
using MedApp.Domain.Enums;

namespace MedApp.Domain.Entities;

public class StudyOrderItem : BaseEntity
{
    public Guid StudyOrderId { get; set; }
    public StudyOrder StudyOrder { get; set; } = null!;

    public Guid ClinicalStudyId { get; set; }
    public ClinicalStudy ClinicalStudy { get; set; } = null!;

    public decimal Price { get; set; }
    public StudyOrderStatus Status { get; set; } = StudyOrderStatus.Requested;
    public string? Observations { get; set; }

    public ICollection<StudyOrderResult> Results { get; set; } = new List<StudyOrderResult>();
}
