import type { OmegaConfig } from "@omega/config";

export function getJiraLink(id: string, omegaConfig: OmegaConfig): string {
  const jiraConfig = omegaConfig.getJiraConfig();
  if (!jiraConfig?.connection?.host) {
    return `https://example.com/browse/${id}`;
  }
  const baseUrl = jiraConfig.connection.host.replace("/rest", "");
  return `${baseUrl}/browse/${id}`;
}

export function getLabelsWithPrefix(
  labels: string[],
  prefix: string,
): string[] {
  const prefixWithColon = `${prefix}:`;
  return labels
    .filter((label) => label.trim().startsWith(prefixWithColon))
    .map((label) => label.trim().replace(prefixWithColon, ""));
}

export function translateLabel(
  labelType: string,
  value: string,
  omegaConfig: OmegaConfig,
): string {
  const labelTranslations = omegaConfig.getLabelTranslations();

  // Map singular label types to plural keys in the translations object
  const labelTypeMapping: Record<string, string> = {
    area: "areas",
    team: "teams",
    theme: "themes",
    initiative: "initiatives",
  };

  const pluralLabelType = labelTypeMapping[labelType] || labelType;
  const translationMap = (labelTranslations as any)[pluralLabelType];

  if (!translationMap) {
    return value;
  }

  return translationMap[value] || value;
}

export function translateLabelWithoutFallback(
  labelType: string,
  value: string,
  omegaConfig: OmegaConfig,
): string | undefined {
  const labelTranslations = omegaConfig.getLabelTranslations();

  // Map singular label types to plural keys in the translations object
  const labelTypeMapping: Record<string, string> = {
    area: "areas",
    team: "teams",
    theme: "themes",
    initiative: "initiatives",
  };

  const pluralLabelType = labelTypeMapping[labelType] || labelType;
  const translationMap = (labelTranslations as any)[pluralLabelType];

  if (!translationMap) {
    return undefined;
  }

  return translationMap[value];
}
