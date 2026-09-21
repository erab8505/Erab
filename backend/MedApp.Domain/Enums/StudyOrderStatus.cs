namespace MedApp.Domain.Enums;

public enum StudyOrderStatus
{
    Requested = 1,        // Solicitado
    SampleCollected = 2,  // Muestra Tomada
    InAnalysis = 3,       // En Análisis / Proceso
    Completed = 4,        // Resultados Listos
    Delivered = 5,        // Entregado al Paciente
    Cancelled = 6         // Cancelado
}
