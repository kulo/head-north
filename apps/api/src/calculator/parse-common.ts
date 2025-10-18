// Legacy parse-common utilities - DEPRECATED
// Most functions have been moved to @omega/jira-primitives
// This file is kept temporarily for backwards compatibility

import type { OmegaConfig } from "@omega/config";

/**
 * @deprecated Use createJiraUrl from @omega/jira-primitives instead
 */
export function getJiraLink(id: string, omegaConfig: OmegaConfig): string {
  const jiraConfig = omegaConfig.getJiraConfig();
  if (!jiraConfig?.connection?.host) {
    return `https://example.com/browse/${id}`;
  }
  const baseUrl = jiraConfig.connection.host.replace("/rest", "");
  return `${baseUrl}/browse/${id}`;
}

/**
 * @deprecated Use extractLabelsWithPrefix from @omega/jira-primitives instead
 */
export function getLabelsWithPrefix(
  labels: string[],
  prefix: string,
): string[] {
  const prefixWithColon = `${prefix}:`;
  return labels
    .filter((label) => label.trim().startsWith(prefixWithColon))
    .map((label) => label.trim().replace(prefixWithColon, ""));
}

/**
 * @deprecated Use OmegaConfig.translateLabel() instead
 */
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
  const translationMap = (labelTranslations as Record<string, unknown>)[
    pluralLabelType
  ];

  if (!translationMap) {
    return value;
  }

  return (translationMap as Record<string, string>)[value] || value;
}

/**
 * @deprecated Use OmegaConfig.translateLabel() instead
 */
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
  const translationMap = (labelTranslations as Record<string, unknown>)[
    pluralLabelType
  ];

  if (!translationMap) {
    return undefined;
  }

  return (translationMap as Record<string, string>)[value];
}
