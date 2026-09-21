namespace MedApp.Domain.Enums;

public enum ParameterValueType
{
    Numeric = 1,     // ej. 95.5 mg/dL con rangos Min/Max
    Qualitative = 2, // ej. Positivo / Negativo / No Reactivo
    TextFree = 3     // ej. Observación microscópica / Descripción
}
