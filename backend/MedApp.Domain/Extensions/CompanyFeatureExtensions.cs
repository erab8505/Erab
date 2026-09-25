using MedApp.Domain.Entities;

namespace MedApp.Domain.Extensions;

public static class CompanyFeatureExtensions
{
    public static bool HasFeature(this Company company, string featureKey)
    {
        if (company?.Features == null) return false;
        var feature = company.Features.FirstOrDefault(f => string.Equals(f.FeatureKey, featureKey, StringComparison.OrdinalIgnoreCase));
        return feature?.IsEnabled ?? false;
    }

    public static Dictionary<string, bool> ToFeaturesDictionary(this IEnumerable<CompanyFeature>? features)
    {
        if (features == null) return new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase);

        var dict = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
        foreach (var feature in features)
        {
            dict[feature.FeatureKey] = feature.IsEnabled;
        }
        return dict;
    }
}
