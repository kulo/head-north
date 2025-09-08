export function getJiraLink(id, omegaConfig) {
  const jiraConfig = omegaConfig.getJiraConfig();
  if (!jiraConfig.host) {
    return `https://example.com/browse/${id}`;
  }
  const baseUrl = jiraConfig.host.replace('/rest', '');
  return `${baseUrl}/browse/${id}`;
}

export function getLabelsWithPrefix(labels, prefix) {
  const prefixWithColon = `${prefix}:`;
  return labels
    .filter(label => label.trim().startsWith(prefixWithColon))
    .map(label => label.trim().replace(prefixWithColon, ''));
}

export function translateLabel(labelType, value, omegaConfig) {
  const labelTranslations = omegaConfig.getLabelTranslations();
  return labelTranslations[labelType][value] || value;
}

export function translateLabelWithoutFallback(labelType, value, omegaConfig) {
  const labelTranslations = omegaConfig.getLabelTranslations();
  return labelTranslations[labelType][value];
}
