using MedApp.Domain.Enums;

namespace MedApp.Application.DTOs;

public class ClinicalStudyExamItemDto
{
    public Guid Id { get; set; }
    public Guid LabExamId { get; set; }
    public string ExamCode { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public SampleType SampleType { get; set; }
    public string SampleTypeName => SampleType.ToString();
    public string? Method { get; set; }
    public int SortOrder { get; set; }
    public List<LabExamParameterItemDto> Parameters { get; set; } = new();
}

public class ClinicalStudyDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public StudyCategory Category { get; set; } = StudyCategory.Laboratory;
    public string CategoryName => Category.ToString();
    public decimal BasePrice { get; set; }
    public string? PreparationInstructions { get; set; }
    public int? TurnaroundTimeHours { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public List<ClinicalStudyExamItemDto> Exams { get; set; } = new();
}

public class CreateClinicalStudyExamDto
{
    public Guid LabExamId { get; set; }
    public int SortOrder { get; set; }
}

public class CreateClinicalStudyDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public StudyCategory Category { get; set; } = StudyCategory.Laboratory;
    public decimal BasePrice { get; set; }
    public string? PreparationInstructions { get; set; }
    public int? TurnaroundTimeHours { get; set; }
    public List<CreateClinicalStudyExamDto> Exams { get; set; } = new();
}

public class UpdateClinicalStudyDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public StudyCategory Category { get; set; } = StudyCategory.Laboratory;
    public decimal BasePrice { get; set; }
    public string? PreparationInstructions { get; set; }
    public int? TurnaroundTimeHours { get; set; }
    public bool IsActive { get; set; } = true;
    public List<CreateClinicalStudyExamDto> Exams { get; set; } = new();
}
