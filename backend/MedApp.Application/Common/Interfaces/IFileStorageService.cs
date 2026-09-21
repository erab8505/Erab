namespace MedApp.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Guid companyId, Guid patientId, string fileName, Stream stream, CancellationToken cancellationToken = default);
    Task<(Stream Stream, string ContentType, string FileName)> GetFileAsync(string storagePath, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string storagePath, CancellationToken cancellationToken = default);
}
