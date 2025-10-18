// Core Domain Types for Omega Applications

// ============================================================================
// Organisation Related Types
// ============================================================================

// Type aliases for better domain clarity

// ============================================================================
// Organisation Types
// ============================================================================

export type AreaId = string;
export type TeamId = string;
export type PersonId = string;
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
  id: PersonId;
  name: string;
}

// ============================================================================
// Cycle Types
// ============================================================================

export type CycleId = string;
export type TicketId = string;
export type InitiativeId = string;
export type StageId = string;
export type RoadmapItemId = string;
export type ReleaseItemId = string;
export type ValidationItemId = string;
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

export interface Initiative {
  id: InitiativeId;
  name: string;
  roadmapItems?: RoadmapItem[];
}

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

export interface Stage {
  id: StageId;
  name: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationItem {
  id: ValidationItemId;
  code: string;
  name: string;
  status: string;
  description?: string;
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
