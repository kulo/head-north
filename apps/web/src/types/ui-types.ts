/**
 * UI Component Types
 *
 * Shared types for UI components
 */

// Page type is now defined locally
export interface Page {
  id: string;
  name: string;
  path: string;
}

export interface BaseComponentProps {
  id?: string;
  className?: string;
  testId?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  header?: boolean;
  footer?: boolean;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface FilterItem {
  id: string;
  name: string;
  value: string;
}

export type StageFilter = FilterItem;
export type InitiativeFilter = FilterItem;
export type AssigneeFilter = FilterItem;
export type CycleFilter = FilterItem;

export interface FilterConfig {
  area?: string;
  initiatives?: InitiativeFilter[];
  stages?: StageFilter[];
  cycle?: string | CycleFilter;
}

// ============================================================================
// Vue Store Types
// ============================================================================

export interface RoadmapData {
  orderedCycles: Cycle[];
  roadmapItems: RoadmapItem[];
  activeCycle: Cycle | null;
  initiatives?: InitiativeWithProgress[];
}

export interface CycleOverviewData {
  cycle: Cycle;
  initiatives: InitiativeWithProgress[];
}

export interface StoreState {
  loading: boolean;
  error: string | null;
  roadmapData: RoadmapData;
  cycles: Cycle[];
  cycleOverviewData: CycleOverviewData | null;
  currentCycleOverviewData: CycleOverviewData | null;
  initiatives: InitiativeWithProgress[];
  assignees: Person[];
  areas: Area[];
  stages: Stage[];
  pages: {
    all: Page[];
    current: Page | null;
  };
  selectedInitiatives: InitiativeWithProgress[];
  selectedAssignees: Person[];
  selectedArea: string | null;
  selectedCycle: Cycle | null;
  selectedStages: Stage[];
  validationEnabled: boolean;
  validationSummary: Record<string, unknown>[];
}

export interface Filters {
  area?: string;
  initiatives?: InitiativeWithProgress[];
  stages?: Stage[];
  assignees?: Person[];
  cycle?: Cycle;
}

// Re-export types from types package for convenience
import type {
  Cycle,
  RoadmapItem,
  Initiative,
  InitiativeWithProgress,
  Person,
  Area,
  Stage,
} from "@omega/types";
