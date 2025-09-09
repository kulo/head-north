export const releaseFilters = [
  { 
    value: "all", 
    name: "All Release Items", 
    predicate: (releaseItem) => true 
  },
  { 
    value: "part-of-narrative", 
    name: "Part of Release Narrative", 
    predicate: (releaseItem) => releaseItem.isPartOfReleaseNarrative,
    style: "anticon anticon-rocket",
  },
  { 
    value: "at-risk", 
    name: "Release at Risk", 
    predicate: (releaseItem) => releaseItem.isReleaseAtRisk,
    style: "anticon anticon-warning",
  },
  { 
    value: "cross-cloud", 
    name: "Cross-Cloud Efforts", 
    predicate: (releaseItem) => releaseItem.isCrossCloud,
    style: "anticon anticon-cloud",
  },
];

export const defaultReleaseFilter = releaseFilters[0];

