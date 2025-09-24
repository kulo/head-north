// Core Domain Types for Omega Applications

// ============================================================================
// Organisation Related Types
// ============================================================================

export interface Area {
  id: string;
  name: string;
  description?: string | null;
  initiatives?: string[];
  progress?: number;
  teams: Team[];
}

export interface Team {
  id: string;
  name: string;
  description: string;
  areaId?: string;
  areaName?: string;
}

export interface Assignee {
  accountId: string;
  displayName: string;
}

// ============================================================================
// Cycle Types
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

export interface Stage {
  id: string;
  name: string;
}

// ============================================================================
// Roadmap and Release Item Types
// ============================================================================

export interface RoadmapItem {
  id: string;
  name: string;
  summary: string;
  area?: string | Area;
  theme?: string | Record<string, unknown>;
  initiative?: Record<string, unknown>;
  initiativeId?: string | null;
  isExternal?: boolean;
  crew?: string;
  projectId?: string;
  url?: string;
  validations?: ValidationItem[];
  releaseItems?: ReleaseItem[];
  labels: string[];
  externalRoadmap: string;
  externalRoadmapDescription?: string;
  isPartOfReleaseNarrative?: boolean;
  isReleaseAtRisk?: boolean;
  startDate?: string;
  endDate?: string;
  isCrossCloud?: boolean;
}

export interface ReleaseItem {
  id: string;
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
  assignee: Assignee | Record<string, unknown>;
  validations: ValidationItem[];
  isPartOfReleaseNarrative: boolean;
  isReleaseAtRisk: boolean;
  roadmapItemId?: string;
  cycleId?: string | number | null;
  cycle?: { id: string; name: string };
  created?: string;
  updated?: string;
  summary?: string;
  closedSprints?: Record<string, unknown>[];
  parent?: string;
  area?: string | Area;
  sprint?: { id: string; name: string } | null;
}

// ============================================================================
// Data Collection and Processing Types
// ============================================================================

export interface RawData {
  cycles: Cycle[];
  sprints: Record<string, unknown>[]; // Jira sprints - generic to avoid circular deps
  roadmapItems: Record<string, unknown>;
  releaseItems: Record<string, unknown>[];
  issues: Record<string, unknown>[]; // Jira issues - generic to avoid circular deps
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
// Validation Types
// ============================================================================

export interface ValidationItem {
  id: string;
  name: string;
  status: string;
  description?: string;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface InitiativeFilter {
  id: string;
  name: string;
  value: string;
}
