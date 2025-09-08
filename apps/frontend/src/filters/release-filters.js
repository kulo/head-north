export const releaseFilters = [
  { 
    value: "all", 
    name: "All Release Items", 
    predicate: (epic) => true 
  },
  { 
    value: "part-of-narrative", 
    name: "Part of Release Narrative", 
    predicate: (epic) => epic.isPartOfReleaseNarrative,
    style: "anticon anticon-rocket",
  },
  { 
    value: "at-risk", 
    name: "Release at Risk", 
    predicate: (epic) => epic.isReleaseAtRisk,
    style: "anticon anticon-warning",
  },
  { 
    value: "cross-cloud", 
    name: "Cross-Cloud Efforts", 
    predicate: (epic) => epic.isCrossCloud,
    style: "anticon anticon-cloud",
  },
];

export const defaultReleaseFilter = releaseFilters[0];

