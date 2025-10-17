// Re-export types from types package for convenience
import type {
  AreaId,
  Cycle,
  CycleId,
  CycleData,
  Initiative,
  InitiativeId,
  PersonId,
  RoadmapItem,
  StageId,
} from "@omega/types";

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

// ============================================================================
// Vue Store Types
// ============================================================================

export interface RoadmapData {
  orderedCycles: Cycle[];
  roadmapItems: RoadmapItem[];
  activeCycle: Cycle | null;
  initiatives?: InitiativeWithProgress[];
}

// ============================================================================
// Frontend-Specific Transformed Data Types
// ============================================================================

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

// Initiative with calculated progress data - extends base initiative
export interface InitiativeWithProgress
  extends Initiative,
    ProgressWithinCycle {}

export interface RoadmapItemWithProgress
  extends RoadmapItem,
    ProgressWithinCycle {}

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
 * Nested cycle data structure that represents the hierarchical
 * relationship: Initiative -> RoadmapItem -> ReleaseItem
 *
 * This is the core data structure that both roadmap and cycle overview
 * views work with, ensuring consistent filtering across the application.
 */
export interface NestedCycleData {
  initiatives: InitiativeWithProgress[];
}

/**
 * Cycle overview data for frontend display.
 * Contains a single cycle with its associated initiatives that have
 * calculated progress metrics for the cycle overview view.
 */
export interface CycleOverviewData extends NestedCycleData {
  cycle: Cycle;
}

export interface StoreState {
  loading: boolean;
  error: string | null;
  validationEnabled: boolean;
  pages: Page[];
  currentPage: string;
  rawData: CycleData | null;
  processedData: NestedCycleData | null;
  filters: ViewFilterCriteria;
  validationSummary: Record<string, unknown>[];
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filter criteria that can be applied to NestedCycleData
 * All filters are applied at the ReleaseItem level and cascade up
 * Uses strong domain types for better type safety
 */
export interface FilterCriteria {
  area?: AreaId;
  initiatives?: InitiativeId[];
  stages?: StageId[];
  assignees?: PersonId[];
  cycle?: CycleId;
}

/**
 * View-specific filter criteria
 * Common filters are shared between views, view-specific filters are isolated
 */
export interface ViewFilterCriteria {
  // Common filters (shared between all views)
  common: {
    area?: AreaId;
    initiatives?: InitiativeId[];
  };
  // Cycle overview specific filters
  cycleOverview: {
    stages?: StageId[];
    assignees?: PersonId[];
    cycle?: CycleId;
  };
  // Roadmap specific filters (currently none, but extensible)
  roadmap: Record<string, never>;
}

/**
 * Filter result containing both the filtered data and metadata
 */
export interface FilterResult {
  data: NestedCycleData;
  appliedFilters: FilterCriteria;
  totalInitiatives: number;
  totalRoadmapItems: number;
  totalReleaseItems: number;
}
