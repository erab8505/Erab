using MedApp.Application.Common.Exceptions;
using MedApp.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace MedApp.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _baseStoragePath;

    public LocalFileStorageService(IWebHostEnvironment environment)
    {
        _baseStoragePath = Path.Combine(environment.ContentRootPath, "App_Data", "Uploads");
        if (!Directory.Exists(_baseStoragePath))
        {
            Directory.CreateDirectory(_baseStoragePath);
        }
    }

    public async Task<string> SaveFileAsync(Guid companyId, Guid patientId, string fileName, Stream stream, CancellationToken cancellationToken = default)
    {
        var targetDir = Path.Combine(_baseStoragePath, companyId.ToString(), patientId.ToString());
        if (!Directory.Exists(targetDir))
        {
            Directory.CreateDirectory(targetDir);
        }

        var safeFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
        var fullPath = Path.Combine(targetDir, safeFileName);

        using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await stream.CopyToAsync(fileStream, cancellationToken);

        // Store relative path
        var relativePath = Path.Combine(companyId.ToString(), patientId.ToString(), safeFileName);
        return relativePath.Replace('\\', '/');
    }

    public Task<(Stream Stream, string ContentType, string FileName)> GetFileAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        var normalizedPath = storagePath.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(_baseStoragePath, normalizedPath);

        if (!File.Exists(fullPath))
        {
            throw new NotFoundException("El archivo solicitado no existe o ha sido eliminado.");
        }

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var contentType = GetContentType(fullPath);
        var fileName = Path.GetFileName(fullPath);

        // Strip the Guid prefix if present
        var firstUnderscore = fileName.IndexOf('_');
        if (firstUnderscore > 0 && firstUnderscore < fileName.Length - 1)
        {
            fileName = fileName[(firstUnderscore + 1)..];
        }

        return Task.FromResult(((Stream)stream, contentType, fileName));
    }

    public Task DeleteFileAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        var normalizedPath = storagePath.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(_baseStoragePath, normalizedPath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    private static string GetContentType(string path)
    {
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".txt" => "text/plain",
            ".dcm" => "application/dicom",
            _ => "application/octet-stream"
        };
    }
}
