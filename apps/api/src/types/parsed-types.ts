// Parsed/Processed DTOs for API data transformation
// These are temporary data structures used only during parsing from Jira to Domain objects

import type {
  ReleaseItem,
  ValidationItem,
  AreaId,
  TeamId,
  RoadmapItemId,
  ReleaseItemId,
  TicketId,
  ProjectId,
  StageId,
  InitiativeId,
} from "@omega/types";

// ============================================================================
// Parsed Roadmap Item DTO
// ============================================================================

export interface ParsedRoadmapItem {
  id: RoadmapItemId;
  initiativeId: InitiativeId | null;
  name: string;
  theme: Record<string, unknown>;
  area: Record<string, unknown>;
  isExternal: boolean;
  releaseItems: ReleaseItem[];
  owningTeam: TeamId;
  url: string;
  validations: ValidationItem[];
}

// ============================================================================
// Parsed Release Item DTO
// ============================================================================

export interface ParsedReleaseItem {
  id: ReleaseItemId;
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
