using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public class StudyOrderResultDto
{
    public Guid Id { get; set; }
    public Guid StudyOrderItemId { get; set; }
    public Guid LabExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public Guid LabParameterId { get; set; }
    public string ParameterCode { get; set; } = string.Empty;
    public string ParameterName { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public ParameterValueType ValueType { get; set; } = ParameterValueType.Numeric;
    public string ValueTypeName => ValueType.ToString();

    public decimal? NumericValue { get; set; }
    public string? TextValue { get; set; }

    public decimal? ReferenceRangeMin { get; set; }
    public decimal? ReferenceRangeMax { get; set; }
    public string? ReferenceText { get; set; }

    public bool IsOutOfRange { get; set; }
    public string? AlertLevel { get; set; } // Normal, High, Low, Critical
    public string? Interpretation { get; set; }
    public string? TechnicianNotes { get; set; }
}

public class StudyOrderItemDto
{
    public Guid Id { get; set; }
    public Guid ClinicalStudyId { get; set; }
    public string StudyCode { get; set; } = string.Empty;
    public string StudyName { get; set; } = string.Empty;
    public StudyCategory StudyCategory { get; set; }
    public string StudyCategoryName => StudyCategory.ToString();
    public decimal Price { get; set; }
    public StudyOrderStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? Observations { get; set; }

    public List<StudyOrderResultDto> Results { get; set; } = new();
}

public class StudyOrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string? PatientDocumentId { get; set; }
    public string? PatientPhone { get; set; }

    public Guid? SpecialistId { get; set; }
    public string? SpecialistName { get; set; }

    public Guid? SchedulingId { get; set; }

    public StudyOrderStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTimeOffset OrderDate { get; set; }
    public DateTimeOffset? CompletedDate { get; set; }
    public string? ClinicalDiagnosis { get; set; }
    public string? Notes { get; set; }
    public decimal TotalAmount { get; set; }

    public Guid? LaboratoristId { get; set; }
    public string? LaboratoristName { get; set; }

    public List<StudyOrderItemDto> Items { get; set; } = new();
}

public class CreateStudyOrderDto
{
    public Guid PatientId { get; set; }
    public Guid? SpecialistId { get; set; }
    public Guid? SchedulingId { get; set; }
    public string? ClinicalDiagnosis { get; set; }
    public string? Notes { get; set; }
    public List<Guid> ClinicalStudyIds { get; set; } = new();
}

public class UpdateStudyOrderStatusDto
{
    public StudyOrderStatus Status { get; set; }
}

public class SaveParameterResultDto
{
    public Guid StudyOrderItemId { get; set; }
    public Guid LabParameterId { get; set; }
    public decimal? NumericValue { get; set; }
    public string? TextValue { get; set; }
    public string? Interpretation { get; set; }
    public string? TechnicianNotes { get; set; }
}

public class SaveStudyResultsDto
{
    public Guid? SpecialistId { get; set; }
    public Guid? LaboratoristId { get; set; }
    public string? LaboratoristName { get; set; }
    public string? GeneralInterpretation { get; set; }
    public List<SaveParameterResultDto> Results { get; set; } = new();
}
