// Core Domain Types for Head North Applications

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

/**
 * Product Area - Organizational unit that groups related functionality or business domains.
 * Represents a product area (e.g., "Frontend", "Backend", "Mobile", "Analytics").
 */
export interface Area {
  readonly id: AreaId;
  readonly name: string;
  readonly teams: readonly Team[];
}

export interface Team {
  readonly id: TeamId;
  readonly name: string;
}

export interface Person {
  readonly id: PersonId;
  readonly name: string;
}

// ============================================================================
// Cycle Types
// ============================================================================

export type CycleId = string;
export type TicketId = string;
export type ObjectiveId = string;
export type StageId = string;
export type RoadmapItemId = string;
export type CycleItemId = string;
export type ValidationItemId = string;
export type CycleState = "active" | "closed" | "future" | "completed";

// Strict ISO date string type for YYYY-MM-DD format
export type ISODateString = `${number}-${number}-${number}`;

// Core cycle - immutable properties
export interface Cycle {
  readonly id: CycleId;
  readonly name: string;
  readonly start: ISODateString;
  readonly end: ISODateString;
  readonly delivery: ISODateString;
  readonly state: CycleState;
}

export interface Objective {
  readonly id: ObjectiveId;
  readonly name: string;
  readonly roadmapItems?: readonly RoadmapItem[];
}

export interface RoadmapItem {
  readonly id: RoadmapItemId;
  readonly name: string;
  readonly summary: string;
  /** Product area associated with this roadmap item */
  readonly area?: string | Area;
  readonly theme?: string | Readonly<Record<string, unknown>>;
  readonly objective?: Readonly<Record<string, unknown>>;
  readonly objectiveId?: ObjectiveId | null;
  readonly isExternal?: boolean;
  readonly owningTeam?: Team;
  readonly url?: string;
  readonly validations?: readonly ValidationItem[];
  readonly cycleItems?: readonly CycleItem[];
  readonly labels: readonly string[];
  readonly startDate?: ISODateString;
  readonly endDate?: ISODateString;
}

export interface CycleItem {
  readonly id: CycleItemId;
  readonly ticketId: TicketId;
  readonly effort: number;
  readonly name: string;
  /** Product area IDs associated with this cycle item */
  readonly areaIds: readonly AreaId[];
  readonly teams: readonly string[];
  readonly status: string;
  readonly url: string;
  readonly isExternal: boolean;
  /** Release stage of this cycle item */
  readonly stage: string;
  readonly assignee: Person | Readonly<Record<string, unknown>>;
  readonly validations: readonly ValidationItem[];
  readonly roadmapItemId?: RoadmapItemId;
  readonly cycleId?: CycleId | null;
  readonly cycle?: { readonly id: CycleId; readonly name: string };
  readonly created?: string;
  readonly updated?: string;
  readonly summary?: string;
  readonly closedSprints?: readonly Readonly<Record<string, unknown>>[];
  readonly parent?: string;
  /** Product area associated with this cycle item */
  readonly area?: string | Area;
  readonly sprint?: { readonly id: string; readonly name: string } | null;
}

/**
 * Release Stage - The current state of roadmap items in the development process.
 * Represents a release stage (e.g., "Discovery", "Development", "Testing", "Released").
 */
export interface Stage {
  readonly id: StageId;
  readonly name: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationItem {
  readonly id: ValidationItemId;
  readonly code: string;
  readonly name: string;
  readonly status: string;
  readonly description?: string;
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
  readonly cycles: readonly Cycle[];
  readonly roadmapItems: readonly RoadmapItem[];
  readonly cycleItems: readonly CycleItem[];
  readonly assignees: readonly Person[];
  /** Product areas indexed by ID */
  readonly areas: Readonly<Record<string, Area>>;
  readonly objectives: readonly Objective[];
  /** Release stages */
  readonly stages: readonly Stage[];
  readonly teams?: readonly Team[];
}

/**
 * Processed cycle data from the data service layer.
 * This represents the data structure returned by CycleDataService after basic processing.
 * Contains raw cycles without progress calculations - progress is added in the transformation layer.
 */
export interface CycleData {
  readonly cycles: readonly Cycle[];
  readonly roadmapItems: readonly RoadmapItem[];
  readonly cycleItems: readonly CycleItem[];
  /** Product areas */
  readonly areas: readonly Area[];
  readonly objectives: readonly Objective[];
  readonly assignees: readonly Person[];
  /** Release stages */
  readonly stages: readonly Stage[];
}
