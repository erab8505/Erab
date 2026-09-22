using MedApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Company> Companies { get; }
    DbSet<User> Users { get; }
    DbSet<UserRoleAssignment> UserRoles { get; }
    DbSet<UserCompany> UserCompanies { get; }
    DbSet<Employee> Employees { get; }
    DbSet<EmployeeAvailability> EmployeeAvailabilities { get; }
    DbSet<Area> Areas { get; }
    DbSet<Specialty> Specialties { get; }
    DbSet<InterventionType> InterventionTypes { get; }
    DbSet<Patient> Patients { get; }
    DbSet<Scheduling> Schedulings { get; }
    DbSet<MedicalRecord> MedicalRecords { get; }
    DbSet<Prescription> Prescriptions { get; }
    DbSet<PrescriptionItem> PrescriptionItems { get; }
    DbSet<Payment> Payments { get; }
    DbSet<PatientDocument> PatientDocuments { get; }
    DbSet<LabParameter> LabParameters { get; }
    DbSet<LabExam> LabExams { get; }
    DbSet<LabExamParameter> LabExamParameters { get; }
    DbSet<ClinicalStudy> ClinicalStudies { get; }
    DbSet<ClinicalStudyExam> ClinicalStudyExams { get; }
    DbSet<StudyOrder> StudyOrders { get; }
    DbSet<StudyOrderItem> StudyOrderItems { get; }
    DbSet<StudyOrderResult> StudyOrderResults { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
