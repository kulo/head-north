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
  readonly id: CycleId;
  readonly name: string;
  readonly start: ISODateString;
  readonly end: ISODateString;
  readonly delivery: ISODateString;
  readonly state: CycleState;
}

export interface Initiative {
  readonly id: InitiativeId;
  readonly name: string;
  readonly roadmapItems?: readonly RoadmapItem[];
}

export interface RoadmapItem {
  readonly id: RoadmapItemId;
  readonly name: string;
  readonly summary: string;
  readonly area?: string | Area;
  readonly theme?: string | Readonly<Record<string, unknown>>;
  readonly initiative?: Readonly<Record<string, unknown>>;
  readonly initiativeId?: InitiativeId | null;
  readonly isExternal?: boolean;
  readonly owningTeam?: Team;
  readonly url?: string;
  readonly validations?: readonly ValidationItem[];
  readonly releaseItems?: readonly ReleaseItem[];
  readonly labels: readonly string[];
  readonly startDate?: ISODateString;
  readonly endDate?: ISODateString;
}

export interface ReleaseItem {
  readonly id: ReleaseItemId;
  readonly ticketId: TicketId;
  readonly effort: number;
  readonly name: string;
  readonly areaIds: readonly AreaId[];
  readonly teams: readonly string[];
  readonly status: string;
  readonly url: string;
  readonly isExternal: boolean;
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
  readonly area?: string | Area;
  readonly sprint?: { readonly id: string; readonly name: string } | null;
}

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
  readonly releaseItems: readonly ReleaseItem[];
  readonly assignees: readonly Person[];
  readonly areas: Readonly<Record<string, Area>>;
  readonly initiatives: readonly Initiative[];
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
  readonly releaseItems: readonly ReleaseItem[];
  readonly areas: readonly Area[];
  readonly initiatives: readonly Initiative[];
  readonly assignees: readonly Person[];
  readonly stages: readonly Stage[];
}
