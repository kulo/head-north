// Parsed/Processed DTOs for API data transformation
// These are temporary data structures used only during parsing from Jira to Domain objects

import type { ReleaseItem, ValidationItem, AreaId } from "@omega/types";

// ============================================================================
// Parsed Roadmap Item DTO
// ============================================================================

export interface ParsedRoadmapItem {
  initiative: Record<string, unknown>;
  initiativeId: string | null;
  name: string;
  theme: Record<string, unknown>;
  projectId: string;
  area: Record<string, unknown>;
  isExternal: boolean;
  releaseItems: ReleaseItem[];
  crew: string;
  url: string;
  validations: ValidationItem[];
  isPartOfReleaseNarrative: boolean;
  isReleaseAtRisk: boolean;
}

// ============================================================================
// Parsed Release Item DTO
// ============================================================================

export interface ParsedReleaseItem {
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
  assignee: Record<string, unknown>;
  validations: ValidationItem[];
  isPartOfReleaseNarrative: boolean;
  isReleaseAtRisk: boolean;
}
