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

// Core cycle - immutable properties
export interface Cycle {
  id: string;
  name: string;
  start: string;
  end: string;
  delivery: string;
  state: CycleState;
  isActive: boolean;
  description?: string;
}

// Cycle with calculated progress data - extends core cycle
export interface CycleWithProgress extends Cycle {
  progress: number;
  progressWithInProgress: number;
  progressByReleaseItems: number;
  weeks: number;
  weeksDone: number;
  weeksInProgress: number;
  weeksNotToDo: number;
  weeksCancelled: number;
  weeksPostponed: number;
  weeksTodo: number;
  releaseItemsCount: number;
  releaseItemsDoneCount: number;
  percentageNotToDo: number;
  startMonth: string;
  endMonth: string;
  daysFromStartOfCycle: number;
  daysInCycle: number;
  currentDayPercentage: number;
}

// Import Sprint from API types (Jira-specific)
import type { Sprint } from "../../../apps/api/src/types";

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
  initiativeId: string;
  initiative: string;
  roadmapItems?: RoadmapItem[];
  weeks?: number;
  weeksDone?: number;
  weeksInProgress?: number;
  weeksNotToDo?: number;
  weeksCancelled?: number;
  weeksPostponed?: number;
  weeksTodo?: number;
  progress?: number;
  progressWithInProgress?: number;
  progressByReleaseItems?: number;
  releaseItemsCount?: number;
  releaseItemsDoneCount?: number;
  percentageNotToDo?: number;
  startMonth?: string;
  endMonth?: string;
  daysFromStartOfCycle?: number;
  daysInCycle?: number;
  currentDayPercentage?: number;
}

export interface Assignee {
  accountId: string;
  displayName: string;
}

export interface Stage {
  id: string;
  name: string;
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
  projectId?: string;
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
  extends ApiResponse<CycleWithProgress | CycleCollection> {}

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
  cycles: CycleWithProgress[];
  roadmapItems: RoadmapItem[];
  releaseItems: ReleaseItem[];
  areas: Area[];
  initiatives: Initiative[];
  assignees: Assignee[];
  stages: string[];
}

// ============================================================================
// Page and Navigation Types
// ============================================================================

export interface Page {
  id: string;
  name: string;
  path: string;
}
