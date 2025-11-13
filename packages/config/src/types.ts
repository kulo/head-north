// Type definitions for config package

import type { Stage } from "@headnorth/types";

export interface ProcessEnv {
  [key: string]: string | undefined;
}

export interface ConfigOverrides {
  environment?: string;
  api?: {
    host?: string;
  };
  [key: string]: unknown;
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

// Generic page configuration interface
export interface PageConfig {
  id: string;
  name: string;
  path: string;
}

export interface FrontendConfig {
  pages: {
    ROOT: PageConfig;
    CYCLE_OVERVIEW: PageConfig;
    ROADMAP: PageConfig;
  };
  getAllPages(): PageConfig[];
}

export interface BackendConfig {
  port?: string;
  maxRetry?: string;
  delayBetweenRetry?: string;
  useFakeData?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jira?: any; // Jira configuration - using any for flexibility with complex nested types
}

export interface HeadNorthConfigData {
  environment: string;
  common: CommonConfig;
  frontend: FrontendConfig;
  backend: BackendConfig;
}

// Branded URL type for strict typing
export type URL = string & { readonly __brand: "URL" };

export interface ValidationRule {
  label: string;
  reference: URL;
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
