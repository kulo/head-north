// Type definitions for shared-config package

export interface ProcessEnv {
  [key: string]: string | undefined;
}

export interface ConfigOverrides {
  environment?: string;
  api?: {
    host?: string;
  };
  [key: string]: any;
}

export interface Stage {
  name: string;
  value: string;
}

export interface StageCategories {
  finalReleaseStage: string[];
  releasableStage: string[];
  externalStages: string[];
}

export interface ReleaseStrategy {
  stages: Stage[];
  stageCategories: StageCategories;
  noPrereleaseAllowedLabel: string;
}

export interface ItemStatusValues {
  TODO: string;
  IN_PROGRESS: string;
  DONE: string;
  CANCELLED: string;
  POSTPONED: string;
}

export interface ItemStatusCategories {
  finished: string[];
  active: string[];
  future: string[];
}

export interface ItemStatuses {
  values: ItemStatusValues;
  categories: ItemStatusCategories;
}

export interface EnvironmentConfig {
  backendHost: string | null;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export interface Environments {
  production: EnvironmentConfig;
  development: EnvironmentConfig;
}

export interface Organisation {
  areas: Record<string, string>;
  teams: Record<string, string>;
}

export interface ProductStrategy {
  themes: Record<string, string>;
  initiatives: Record<string, string>;
}

export interface CommonConfig {
  cache: {
    ttl: number;
  };
  releaseStrategy: ReleaseStrategy;
  development: {
    useFakeData: boolean;
  };
  itemStatuses: ItemStatuses;
  environments: Environments;
  organisation: Organisation;
  productStrategy: ProductStrategy;
}

export interface Page {
  id: string;
  path: string;
  name: string;
}

export interface FrontendConfig {
  pages: {
    ROOT: Page;
    CYCLE_OVERVIEW: Page;
    ROADMAP: Page;
  };
  getAllPages(): Page[];
}

export interface JiraFields {
  epic: string;
  sprint: string;
  storyPoints: string;
}

export interface JiraConnection {
  user: string | null;
  token: string | null;
  host: string | null;
  boardId: number;
}

export interface JiraStatusMappings {
  [statusId: string]: string;
}

export interface JiraStatusCategories {
  finished: string[];
  active: string[];
  future: string[];
}

export interface JiraLimits {
  maxResults: number;
  maxIssuesPerRequest: number;
}

export interface JiraConfig {
  statusMappings: JiraStatusMappings;
  statusCategories: JiraStatusCategories;
  limits: JiraLimits;
  fields: JiraFields;
  connection: JiraConnection;
}

export interface BackendConfig {
  port?: string;
  maxRetry?: string;
  delayBetweenRetry?: string;
  jira?: JiraConfig;
  useFakeData?: boolean;
}

export interface OmegaConfigData {
  environment: string;
  common: CommonConfig;
  frontend: FrontendConfig;
  backend: BackendConfig;
}

export interface ValidationRule {
  label: string;
  reference: string;
}

export interface ValidationRules {
  releaseItem: {
    noProjectId: ValidationRule;
    missingAreaLabel: ValidationRule;
    missingTeamLabel: ValidationRule;
    missingTeamTranslation: (team: string) => ValidationRule;
    missingEstimate: ValidationRule;
    tooGranularEstimate: ValidationRule;
    missingStage: ValidationRule;
    missingAssignee: ValidationRule;
    tooLowStageWithoutProperRoadmapItem: ValidationRule;
  };
  roadmapItem: {
    missingAreaLabel: ValidationRule;
    missingThemeLabel: ValidationRule;
    missingInitiativeLabel: ValidationRule;
    missingAreaTranslation: (area: string) => ValidationRule;
    missingThemeTranslation: (theme: string) => ValidationRule;
    missingInitiativeTranslation: (initiative: string) => ValidationRule;
    missingExternalRoadmap: ValidationRule;
    iternalWithStagedReleaseItem: ValidationRule;
    missingExternalRoadmapDescription: ValidationRule;
  };
}
