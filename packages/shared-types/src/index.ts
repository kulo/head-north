// Shared types and interfaces for Omega applications

// ============================================================================
// Common API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string | null;
}

// ============================================================================
// JIRA Related Types
// ============================================================================

// ============================================================================
// Release Related Types
// ============================================================================

export interface Release {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  initiatives: string[];
  items: string[];
}

// ============================================================================
// Area Related Types
// ============================================================================

export interface Team {
  id: string;
  name: string;
  description: string;
  areaId?: string;
  areaName?: string;
}

export interface Area {
  id: string;
  name: string;
  description?: string | null;
  initiatives?: string[];
  progress?: number;
  teams: Team[];
}

// ============================================================================
// Cycle/Sprint Types (Cycles replace Sprints in non-Jira code)
// ============================================================================

export type CycleState = "active" | "closed" | "future" | "completed";

export interface Cycle {
  id: string;
  name: string;
  start: string;
  end: string;
  delivery: string;
  state: CycleState;
  progress: number;
  isActive: boolean;
  description?: string;
}

// Sprint interface for Jira domain (different from Cycle)
export interface Sprint {
  id: string | number;
  name: string;
  state: string;
  startDate: string;
  endDate: string;
}

// ============================================================================
// Cycle Collection Types
// ============================================================================

export interface CycleCollection {
  active: Cycle | null;
  ordered: Cycle[];
  byState: {
    active: Cycle[];
    closed: Cycle[];
    future: Cycle[];
  };
}

// ============================================================================
// Unified Data System Types
// ============================================================================

export interface Initiative {
  id: string;
  name: string;
  initiativeId?: string;
  initiative?: string;
  roadmapItems?: RoadmapItem[];
}

export interface Assignee {
  accountId: string;
  displayName: string;
}

// ============================================================================
// JIRA Issue Types
// ============================================================================

export interface JiraIssueFields {
  summary: string;
  description?: string;
  status: { id: string; name: string };
  assignee: Assignee | null;
  reporter?: any;
  effort?: number;
  externalRoadmap?: string;
  labels: string[];
  parent?: { key: string };
  issuetype: { name: string };
  area?: string;
  initiativeId?: string;
  url?: string;
  sprint?: Sprint | null;
  teams?: string[];
  areaIds?: string[];
  created?: string;
  updated?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraIssueFields;
  parent?: string;
  created?: string;
  updated?: string;
}

// ============================================================================
// Roadmap and Release Item Types
// ============================================================================

export interface RoadmapItem {
  id?: string;
  name?: string;
  summary: string;
  area?: string | any;
  theme?: string | any;
  initiative?: any;
  initiativeId?: string | null;
  isExternal?: boolean;
  crew?: string;
  url?: string;
  validations?: any[];
  releaseItems?: ReleaseItem[];
  labels: string[];
  externalRoadmap: string;
  externalRoadmapDescription?: string;
  isPartOfReleaseNarrative?: boolean;
  isReleaseAtRisk?: boolean;
}

export interface ReleaseItem {
  id?: string;
  ticketId: string;
  effort: number;
  projectId: string | null;
  name: string;
  areaIds: string[];
  teams: string[];
  status: string;
  url: string;
  isExternal: boolean;
  stage: string;
  assignee: Assignee | any;
  validations: any[];
  isPartOfReleaseNarrative: boolean;
  isReleaseAtRisk: boolean;
  roadmapItemId?: string;
  cycleId?: string | number | null;
  cycle?: { id: string; name: string };
  created?: string;
  updated?: string;
  summary?: string;
  closedSprints?: any[];
  parent?: string;
  sprint?: Sprint | null;
}

// ============================================================================
// Parsed/Processed Types
// ============================================================================

export interface ParsedRoadmapItem {
  initiative: any;
  initiativeId: string | null;
  name: string;
  theme: any;
  projectId: string;
  area: any;
  isExternal: boolean;
  releaseItems: ReleaseItem[];
  crew: string;
  url: string;
  validations: any[];
  isPartOfReleaseNarrative: boolean;
  isReleaseAtRisk: boolean;
}

export interface ParsedReleaseItem {
  ticketId: string;
  effort: number;
  projectId: string | null;
  name: string;
  areaIds: string[];
  teams: string[];
  status: string;
  url: string;
  isExternal: boolean;
  stage: string;
  assignee: any;
  validations: any[];
  isPartOfReleaseNarrative: boolean;
  isReleaseAtRisk: boolean;
}

// ============================================================================
// Enhanced Unified Data Structure
// ============================================================================

export type DataType = "roadmap" | "cycle-overview";

export interface UnifiedDataMetadata {
  type: DataType;
  cycles: CycleCollection | null;
  stages: string[];
  areas: Area[];
  assignees: string[];
  initiatives: Initiative[];
}

export interface UnifiedData {
  metadata: UnifiedDataMetadata;
  data: {
    initiatives: Initiative[];
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CycleApiResponse
  extends ApiResponse<Cycle | CycleCollection> {}

export interface UnifiedApiResponse extends ApiResponse<UnifiedData> {}

// ============================================================================
// Filter and Selection Types
// ============================================================================

export interface FilterOptions {
  areas?: string[];
  initiatives?: string[];
  stages?: string[];
  assignees?: string[];
  cycles?: string[];
}

export interface SelectionState {
  selectedArea: string | null;
  selectedInitiative: string | null;
  selectedStage: string | null;
  selectedAssignee: string | null;
  selectedCycle: string | null;
}

// ============================================================================
// Chart and Visualization Types
// ============================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface OmegaConfig {
  apiBaseUrl: string;
  jiraBaseUrl: string;
  jiraUsername: string;
  jiraApiToken: string;
  environment: "development" | "staging" | "production";
}

// ============================================================================
// Data Collection and Processing Types
// ============================================================================

export interface RawData {
  cycles: Cycle[];
  sprints: Sprint[];
  roadmapItems: Record<string, any>;
  releaseItems: any[];
  issues: JiraIssue[];
  assignees: Assignee[];
  areas: Record<string, Area>;
  initiatives: Initiative[];
  stages: string[];
  teams?: Team[];
}

export interface CycleData {
  cycles: Cycle[];
  roadmapItems: RoadmapItem[];
  releaseItems: ReleaseItem[];
  areas: Area[];
  initiatives: Initiative[];
  assignees: Assignee[];
  stages: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
