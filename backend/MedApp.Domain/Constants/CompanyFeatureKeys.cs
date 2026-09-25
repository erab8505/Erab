namespace MedApp.Domain.Constants;

public static class CompanyFeatureKeys
{
    // Module Features
    public const string ModuleScheduling = "MODULE_SCHEDULING";
    public const string ModuleLaboratory = "MODULE_LABORATORY";

    // Operational Policies / Permissions
    public const string AllowReceptionistStudyOrders = "ALLOW_RECEPTIONIST_STUDY_ORDERS";

    // Static helper list of all known features
    public static readonly IReadOnlyList<string> All = new[]
    {
        ModuleScheduling,
        ModuleLaboratory,
        AllowReceptionistStudyOrders
    };
}
