// Parsed/Processed DTOs for API data transformation
// These are temporary data structures used only during parsing from Jira to Domain objects

import type {
  CycleItem,
  ValidationItem,
  AreaId,
  TeamId,
  RoadmapItemId,
  CycleItemId,
  TicketId,
  ProjectId,
  StageId,
  ObjectiveId,
} from "@headnorth/types";

// ============================================================================
// Parsed Roadmap Item DTO
// ============================================================================

export interface ParsedRoadmapItem {
  id: RoadmapItemId;
  objectiveId: ObjectiveId | null;
  name: string;
  theme: Record<string, unknown>;
  area: Record<string, unknown>;
  isExternal: boolean;
  cycleItems: CycleItem[];
  owningTeam: TeamId;
  url: string;
  validations: ValidationItem[];
}

// ============================================================================
// Parsed Cycle Item DTO
// ============================================================================

export interface ParsedCycleItem {
  id: CycleItemId;
  ticketId: TicketId;
  effort: number;
  projectId: ProjectId | null;
  name: string;
  areaIds: AreaId[];
  teams: TeamId[];
  status: string;
  url: string;
  isExternal: boolean;
  stage: StageId;
  assignee: Record<string, unknown>;
  validations: ValidationItem[];
}
