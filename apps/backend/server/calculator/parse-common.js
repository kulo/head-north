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
  
  // Map singular label types to plural keys in the translations object
  const labelTypeMapping = {
    'area': 'areas',
    'team': 'teams', 
    'theme': 'themes',
    'initiative': 'initiatives'
  };
  
  const pluralLabelType = labelTypeMapping[labelType] || labelType;
  const translationMap = labelTranslations[pluralLabelType];
  
  if (!translationMap) {
    return value;
  }
  
  return translationMap[value] || value;
}

export function translateLabelWithoutFallback(labelType, value, omegaConfig) {
  const labelTranslations = omegaConfig.getLabelTranslations();
  
  // Map singular label types to plural keys in the translations object
  const labelTypeMapping = {
    'area': 'areas',
    'team': 'teams', 
    'theme': 'themes',
    'initiative': 'initiatives'
  };
  
  const pluralLabelType = labelTypeMapping[labelType] || labelType;
  const translationMap = labelTranslations[pluralLabelType];
  
  if (!translationMap) {
    return undefined;
  }
  
  return translationMap[value];
}
