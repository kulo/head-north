// Re-export types from types package for convenience
import type {
  Area,
  AreaId,
  Cycle,
  CycleId,
  CycleData,
  Initiative,
  InitiativeId,
  Person,
  PersonId,
  ReleaseItem,
  ReleaseItemId,
  RoadmapItem,
  RoadmapItemId,
  StageId,
  Stage,
  ValidationItem,
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

export interface UnifiedStoreState {
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

export interface Filters {
  area?: string;
  initiatives?: InitiativeWithProgress[];
  stages?: Stage[];
  assignees?: Person[];
  cycle?: Cycle;
}

// ============================================================================
// Unified Filter Types
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
  roadmap: {
    // Future roadmap-specific filters can be added here
  };
}

/**
 * Filter predicate function type
 */
export type FilterPredicate<T> = (item: T) => boolean;

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
