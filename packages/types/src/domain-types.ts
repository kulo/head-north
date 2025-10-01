// Core Domain Types for Omega Applications

// ============================================================================
// Organisation Related Types
// ============================================================================

// Type aliases for better domain clarity
export type AreaId = string;
export type TeamId = string;

export interface Area {
  id: AreaId;
  name: string;
  teams: Team[];
}

export interface Team {
  id: TeamId;
  name: string;
}

export interface Person {
  accountId: string;
  displayName: string;
}

// ============================================================================
// Cycle Types
// ============================================================================

export type CycleState = "active" | "closed" | "future" | "completed";

// Strict ISO date string type for YYYY-MM-DD format
export type ISODateString = `${number}-${number}-${number}`;

// Core cycle - immutable properties
export interface Cycle {
  id: string;
  name: string;
  start: ISODateString;
  end: ISODateString;
  delivery: ISODateString;
  state: CycleState;
}

// Progress data that can be shared between cycles and initiatives
export interface ProgressWithinCycle {
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

// Cycle with calculated progress data - extends core cycle
export interface CycleWithProgress extends Cycle, ProgressWithinCycle {}

export interface Initiative extends ProgressWithinCycle {
  id: string;
  name: string;
  initiativeId: string;
  initiative: string;
  roadmapItems?: RoadmapItem[];
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
  startDate?: ISODateString;
  endDate?: ISODateString;
  isCrossCloud?: boolean;
}

export interface ReleaseItem {
  id: string;
  ticketId: string;
  effort: number;
  projectId: string | null;
  name: string;
  areaIds: AreaId[];
  teams: string[];
  status: string;
  url: string;
  isExternal: boolean;
  stage: string;
  assignee: Person | Record<string, unknown>;
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
  roadmapItems: RoadmapItem[];
  releaseItems: ReleaseItem[];
  issues: Record<string, unknown>[]; // Jira issues - generic to avoid circular deps
  assignees: Person[];
  areas: Record<string, Area>;
  initiatives: Initiative[];
  stages: Stage[];
  teams?: Team[];
}

export interface CycleData {
  cycles: CycleWithProgress[];
  roadmapItems: RoadmapItem[];
  releaseItems: ReleaseItem[];
  areas: Area[];
  initiatives: Initiative[];
  assignees: Person[];
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
