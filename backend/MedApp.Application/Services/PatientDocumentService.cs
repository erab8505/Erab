using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using MedApp.Application.DTOs;
using MedApp.Application.Interfaces;
using MedApp.Domain.Entities;
using MedApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedApp.Application.Services;

public class PatientDocumentService : IPatientDocumentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICompanyContext _companyContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorageService;

    private static readonly string[] AllowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt", ".dcm"];
    private const long MaxFileSizeBytes = 25 * 1024 * 1024; // 25 MB

    public PatientDocumentService(
        IApplicationDbContext context,
        ICompanyContext companyContext,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _companyContext = companyContext;
        _currentUserService = currentUserService;
        _fileStorageService = fileStorageService;
    }

    private Guid CurrentCompanyId => _companyContext.CompanyId
        ?? throw new ForbiddenAccessException("No se ha seleccionado una empresa activa (X-Company-Id faltante).");

    public async Task<List<PatientDocumentDto>> GetDocumentsByPatientIdAsync(Guid patientId, DocumentCategory? category = null)
    {
        var patientExists = await _context.Patients.AnyAsync(p => p.Id == patientId);
        if (!patientExists)
            throw new NotFoundException("Paciente no encontrado.");

        var query = _context.PatientDocuments
            .Where(d => d.PatientId == patientId);

        if (category.HasValue)
        {
            query = query.Where(d => d.Category == category.Value);
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new PatientDocumentDto(
                d.Id,
                d.CompanyId,
                d.PatientId,
                d.MedicalRecordId,
                d.Title,
                d.FileName,
                d.OriginalFileName,
                d.ContentType,
                d.FileSizeBytes,
                d.Category,
                d.Description,
                d.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<PatientDocumentDto?> GetDocumentByIdAsync(Guid id)
    {
        var d = await _context.PatientDocuments.FirstOrDefaultAsync(doc => doc.Id == id);
        if (d == null) return null;

        return new PatientDocumentDto(
            d.Id,
            d.CompanyId,
            d.PatientId,
            d.MedicalRecordId,
            d.Title,
            d.FileName,
            d.OriginalFileName,
            d.ContentType,
            d.FileSizeBytes,
            d.Category,
            d.Description,
            d.CreatedAt
        );
    }

    public async Task<PatientDocumentDto> UploadDocumentAsync(
        Guid patientId,
        string title,
        DocumentCategory category,
        string? description,
        Guid? medicalRecordId,
        string originalFileName,
        string contentType,
        long fileSize,
        Stream fileStream)
    {
        var patientExists = await _context.Patients.AnyAsync(p => p.Id == patientId);
        if (!patientExists)
            throw new NotFoundException("Paciente no encontrado.");

        if (fileSize > MaxFileSizeBytes)
            throw new ValidationAppException("El archivo supera el tamaño máximo permitido de 25 MB.");

        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            throw new ValidationAppException($"El formato de archivo '{ext}' no está permitido. Formatos admitidos: PDF, JPG, PNG, WEBP, TXT, DICOM.");

        var displayTitle = string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(originalFileName) : title.Trim();

        var storagePath = await _fileStorageService.SaveFileAsync(CurrentCompanyId, patientId, originalFileName, fileStream);

        var doc = new PatientDocument
        {
            CompanyId = CurrentCompanyId,
            PatientId = patientId,
            MedicalRecordId = medicalRecordId,
            Title = displayTitle,
            FileName = Path.GetFileName(storagePath),
            OriginalFileName = originalFileName,
            ContentType = contentType,
            FileSizeBytes = fileSize,
            StoragePath = storagePath,
            Category = category,
            Description = description,
            UploadedByUserId = _currentUserService.UserId
        };

        _context.PatientDocuments.Add(doc);
        await _context.SaveChangesAsync();

        return (await GetDocumentByIdAsync(doc.Id))!;
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> DownloadDocumentAsync(Guid id)
    {
        var doc = await _context.PatientDocuments.FirstOrDefaultAsync(d => d.Id == id);
        if (doc == null)
            throw new NotFoundException("Documento no encontrado.");

        var (stream, contentType, fileName) = await _fileStorageService.GetFileAsync(doc.StoragePath);
        return (stream, doc.ContentType ?? contentType, doc.OriginalFileName ?? fileName);
    }

    public async Task<bool> DeleteDocumentAsync(Guid id)
    {
        var doc = await _context.PatientDocuments.FirstOrDefaultAsync(d => d.Id == id);
        if (doc == null)
            throw new NotFoundException("Documento no encontrado.");

        await _fileStorageService.DeleteFileAsync(doc.StoragePath);
        _context.PatientDocuments.Remove(doc);
        await _context.SaveChangesAsync();
        return true;
    }
}
