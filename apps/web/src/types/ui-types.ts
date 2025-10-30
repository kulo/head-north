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
  readonly id: string;
  readonly name: string;
  readonly path: string;
}

// ============================================================================
// Vue Store Types
// ============================================================================

export interface RoadmapData {
  readonly orderedCycles: readonly Cycle[];
  readonly roadmapItems: readonly RoadmapItem[];
  readonly activeCycle: Cycle | null;
  readonly initiatives?: readonly InitiativeWithProgress[];
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
  readonly progress: number;
  readonly progressWithInProgress: number;
  readonly progressByReleaseItems: number;
  readonly weeks: number;
  readonly weeksDone: number;
  readonly weeksInProgress: number;
  readonly weeksNotToDo: number;
  readonly weeksCancelled: number;
  readonly weeksPostponed: number;
  readonly weeksTodo: number;
  readonly releaseItemsCount: number;
  readonly releaseItemsDoneCount: number;
  readonly percentageNotToDo: number;
  readonly startMonth: string;
  readonly endMonth: string;
  readonly daysFromStartOfCycle: number;
  readonly daysInCycle: number;
  readonly currentDayPercentage: number;
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
  readonly startMonth: string;
  readonly endMonth: string;
  readonly daysFromStartOfCycle: number;
  readonly daysInCycle: number;
  readonly currentDayPercentage: number;
}

/**
 * Pure progress metrics for calculation functions.
 * Contains only the core progress data without cycle metadata.
 * Used by calculation functions that need to work with progress metrics
 * without the overhead of cycle-specific metadata like dates and months.
 */
export interface ProgressMetrics {
  readonly progress: number;
  readonly progressWithInProgress: number;
  readonly progressByReleaseItems: number;
  readonly weeks: number;
  readonly weeksDone: number;
  readonly weeksInProgress: number;
  readonly weeksNotToDo: number;
  readonly weeksCancelled: number;
  readonly weeksPostponed: number;
  readonly weeksTodo: number;
  readonly releaseItemsCount: number;
  readonly releaseItemsDoneCount: number;
  readonly percentageNotToDo: number;
}

/**
 * Nested cycle data structure that represents the hierarchical
 * relationship: Initiative -> RoadmapItem -> ReleaseItem
 *
 * This is the core data structure that both roadmap and cycle overview
 * views work with, ensuring consistent filtering across the application.
 */
export interface NestedCycleData {
  readonly initiatives: readonly InitiativeWithProgress[];
}

/**
 * Cycle overview data for frontend display.
 * Contains a single cycle with its associated initiatives that have
 * calculated progress metrics for the cycle overview view.
 */
export interface CycleOverviewData extends NestedCycleData {
  readonly cycle: Cycle;
}

export interface StoreState {
  readonly loading: boolean;
  readonly error: string | null;
  readonly validationEnabled: boolean;
  readonly pages: readonly Page[];
  readonly currentPage: string;
  readonly rawData: CycleData | null;
  readonly processedData: NestedCycleData | null;
  readonly filters: ViewFilterCriteria;
  readonly validationSummary: readonly Readonly<Record<string, unknown>>[];
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
  readonly area?: AreaId;
  readonly initiatives?: readonly InitiativeId[];
  readonly stages?: readonly StageId[];
  readonly assignees?: readonly PersonId[];
  readonly cycle?: CycleId;
  readonly showValidationErrors?: boolean;
}

/**
 * View-specific filter criteria
 * Common filters are shared between views, view-specific filters are isolated
 */
export interface ViewFilterCriteria {
  // Common filters (shared between all views)
  readonly common: {
    readonly area?: AreaId;
    readonly initiatives?: readonly InitiativeId[];
  };
  // Cycle overview specific filters
  readonly cycleOverview: {
    readonly stages?: readonly StageId[];
    readonly assignees?: readonly PersonId[];
    readonly cycle?: CycleId;
  };
  // Roadmap specific filters (currently none, but extensible)
  readonly roadmap: Readonly<Record<string, never>>;
}

/**
 * Filter result containing both the filtered data and metadata
 */
export interface FilterResult {
  readonly data: NestedCycleData;
  readonly appliedFilters: FilterCriteria;
  readonly totalInitiatives: number;
  readonly totalRoadmapItems: number;
  readonly totalReleaseItems: number;
}
