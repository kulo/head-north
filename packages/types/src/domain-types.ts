// Core Domain Types for Omega Applications

// ============================================================================
// Organisation Related Types
// ============================================================================

// Type aliases for better domain clarity
export type AreaId = string;
export type TeamId = string;
export type CycleId = string;
export type InitiativeId = string;
export type StageId = string;
export type RoadmapItemId = string;
export type ReleaseItemId = string;
export type ValidationItemId = string;
export type PersonId = string;
export type TicketId = string;
export type ProjectId = string;

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
  accountId: PersonId;
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
  id: CycleId;
  name: string;
  start: ISODateString;
  end: ISODateString;
  delivery: ISODateString;
  state: CycleState;
}

/**
 * Complete progress data including cycle metadata.
 * Contains both progress metrics and cycle-specific metadata like dates and months.
 * Used by complete entities (CycleWithProgress, InitiativeWithProgress) that need
 * both progress calculations and contextual cycle information.
 */
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

export interface Initiative {
  id: InitiativeId;
  name: string;
  roadmapItems?: RoadmapItem[];
}

// Initiative with calculated progress data - extends base initiative
export interface InitiativeWithProgress
  extends Initiative,
    ProgressWithinCycle {}

export interface Stage {
  id: StageId;
  name: string;
}

// ============================================================================
// Roadmap and Release Item Types
// ============================================================================

export interface RoadmapItem {
  id: RoadmapItemId;
  name: string;
  summary: string;
  area?: string | Area;
  theme?: string | Record<string, unknown>;
  initiative?: Record<string, unknown>;
  initiativeId?: InitiativeId | null;
  isExternal?: boolean;
  owningTeam?: Team;
  projectId?: ProjectId;
  url?: string;
  validations?: ValidationItem[];
  releaseItems?: ReleaseItem[];
  labels: string[];
  startDate?: ISODateString;
  endDate?: ISODateString;
}

export interface ReleaseItem {
  id: ReleaseItemId;
  ticketId: TicketId;
  effort: number;
  projectId: ProjectId | null;
  name: string;
  areaIds: AreaId[];
  teams: string[];
  status: string;
  url: string;
  isExternal: boolean;
  stage: string;
  assignee: Person | Record<string, unknown>;
  validations: ValidationItem[];
  roadmapItemId?: RoadmapItemId;
  cycleId?: CycleId | null;
  cycle?: { id: CycleId; name: string };
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

/**
 * Raw cycle data collected from Jira and other sources before any frontend processing.
 * This represents the initial, unprocessed data structure returned by the backend API.
 * Contains raw Jira objects and domain entities in their original form.
 */
export interface RawCycleData {
  cycles: Cycle[];
  roadmapItems: RoadmapItem[];
  releaseItems: ReleaseItem[];
  assignees: Person[];
  areas: Record<string, Area>;
  initiatives: Initiative[];
  stages: Stage[];
  teams?: Team[];
}

/**
 * Processed cycle data from the data service layer.
 * This represents the data structure returned by CycleDataService after basic processing.
 * Contains raw cycles without progress calculations - progress is added in the transformation layer.
 */
export interface CycleData {
  cycles: Cycle[];
  roadmapItems: RoadmapItem[];
  releaseItems: ReleaseItem[];
  areas: Area[];
  initiatives: Initiative[];
  assignees: Person[];
  stages: Stage[];
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationItem {
  id: ValidationItemId;
  name: string;
  status: string;
  description?: string;
}
