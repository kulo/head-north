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

/**
 * Transformed roadmap data for frontend display.
 * Contains processed initiatives with calculated progress metrics
 * for the roadmap view.
 */
export interface TransformedRoadmapData {
  initiatives: InitiativeWithProgress[];
}

// ============================================================================
// Frontend-Specific Transformed Data Types
// ============================================================================

/**
 * Release item with embedded cycle information.
 * Extends a release item to include cycle context for display purposes.
 * Used when release items need to show which cycle they belong to.
 */
export interface ReleaseItemWithCycle extends ReleaseItem {
  cycle: {
    id: CycleId;
    name: string;
  };
}

/**
 * Transformed roadmap item for frontend display.
 * Contains processed roadmap item data with calculated metrics and
 * embedded release items that include cycle context.
 */
export interface TransformedRoadmapItem {
  id: string;
  name: string;
  area?: string;
  theme?: string;
  owner: string;
  progress: number;
  weeks: number;
  url: string;
  validations: ValidationItem[];
  releaseItems: ReleaseItemWithCycle[];
}

/**
 * Cycle-specific metadata for date and time calculations.
 * Contains temporal information about cycles like start/end months,
 * days elapsed, and percentage completion within the cycle timeframe.
 */
export interface CycleMetadata {
  startMonth: string;
  endMonth: string;
  daysFromStartOfCycle: number;
  daysInCycle: number;
  currentDayPercentage: number;
}

/**
 * Pure progress metrics for calculation functions.
 * Contains only the core progress data without cycle metadata.
 * Used by calculation functions that need to work with progress metrics
 * without the overhead of cycle-specific metadata like dates and months.
 */
export interface ProgressMetrics {
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
}

/**
 * Cycle overview data for frontend display.
 * Contains a single cycle with its associated initiatives that have
 * calculated progress metrics for the cycle overview view.
 */
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
  InitiativeWithProgress,
  Person,
  Area,
  Stage,
  ReleaseItem,
  CycleId,
  ValidationItem,
} from "@omega/types";
