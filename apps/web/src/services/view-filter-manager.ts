/**
 * View Filter Manager
 *
 * Manages view-specific filtering logic with type safety and dependency injection.
 * Ensures that:
 * 1. Common filters (area, initiatives) are preserved when switching views
 * 2. View-specific filters are reset when switching to incompatible views
 * 3. Filter state is maintained appropriately for each view
 * 4. All operations are type-safe and validated
 *
 * Implemented as a factory function for functional programming patterns.
 */

import type { OmegaConfig } from "@omega/config";
import type {
  AreaId,
  CycleId,
  InitiativeId,
  PersonId,
  StageId,
} from "@omega/types";
import type { ViewFilterCriteria } from "../types/ui-types";
import type {
  ViewFilterManager,
  FilterKey,
  PageId,
  TypedFilterCriteria,
} from "../types/filter-types";
import { FilterConfigurationService } from "./filter-configuration";

/**
 * Helper to create a deep readonly copy of arrays for return values
 */
const createReadonlyArray = <T>(
  arr: T[] | undefined,
): readonly T[] | undefined => (arr ? [...arr] : undefined);

/**
 * Helper to create mutable arrays for internal state
 */
const createMutableArray = <T>(
  arr: readonly T[] | T[] | undefined,
): T[] | undefined => (arr ? [...arr] : undefined);

/**
 * Helper to create a deep mutable copy of filter criteria for internal use
 */
const createMutableFilters = (
  filters: ViewFilterCriteria,
): ViewFilterCriteria => ({
  common: {
    ...filters.common,
    initiatives: createMutableArray(filters.common.initiatives),
  },
  cycleOverview: {
    ...filters.cycleOverview,
    stages: createMutableArray(filters.cycleOverview.stages),
    assignees: createMutableArray(filters.cycleOverview.assignees),
  },
  roadmap: { ...filters.roadmap },
});

/**
 * Factory function to create ViewFilterManager with immutable state management
 *
 * @param config - OmegaConfig instance for filter configuration
 * @returns ViewFilterManager instance with functional state management
 */
export function createViewFilterManager(
  config: OmegaConfig,
): ViewFilterManager {
  // Immutable state held in closure
  let currentView: PageId = "cycle-overview";
  let viewFilters: ViewFilterCriteria = {
    common: {},
    cycleOverview: {},
    roadmap: {},
  };

  const filterConfig = new FilterConfigurationService(config);

  /**
   * Switch to a new view and return appropriate filters
   */
  const switchView = (pageId: PageId): TypedFilterCriteria => {
    // Validate that the page exists in configuration
    if (!filterConfig.getViewFilters(pageId).length && pageId !== "root") {
      console.warn(`No filters configured for page: ${pageId}`);
    }

    // Create new state (immutable update)
    currentView = pageId;
    return getActiveFilters();
  };

  /**
   * Get the current view
   */
  const getCurrentView = (): PageId => currentView;

  /**
   * Helper to create mutable value from unknown
   */
  const makeMutableValue = (val: unknown): unknown => {
    if (Array.isArray(val)) {
      return [...val]; // Create mutable copy
    }
    return val;
  };

  /**
   * Update a filter for the current view
   */
  const updateFilter = (
    filterKey: FilterKey,
    value: unknown,
  ): TypedFilterCriteria => {
    // Validate that this filter is valid for the current view
    if (!filterConfig.isValidFilterForView(filterKey, currentView)) {
      throw new Error(
        `Filter '${filterKey}' is not valid for view '${currentView}'`,
      );
    }

    // Create new filter state (immutable update)
    const newValue = value === undefined ? undefined : makeMutableValue(value);

    if (filterConfig.isCommonFilter(filterKey)) {
      // Update common filter - create new object to ensure reactivity
      viewFilters = {
        ...viewFilters,
        common: {
          ...viewFilters.common,
          [filterKey]: newValue,
        },
      };
    } else {
      // Update view-specific filter
      if (currentView === "cycle-overview") {
        viewFilters = {
          ...viewFilters,
          cycleOverview: {
            ...viewFilters.cycleOverview,
            [filterKey]: newValue,
          },
        };
      } else if (currentView === "roadmap") {
        // Roadmap filters are currently empty, but handle for future extensibility
        viewFilters = {
          ...viewFilters,
          roadmap: {} as Record<string, never>,
        };
      }
    }

    return getActiveFilters();
  };

  /**
   * Get active filters for the current view
   */
  const getActiveFilters = (): TypedFilterCriteria => {
    const activeFilters: TypedFilterCriteria = {
      area: viewFilters.common.area,
      initiatives: viewFilters.common.initiatives
        ? [...viewFilters.common.initiatives]
        : undefined,
    };

    if (currentView === "cycle-overview") {
      // Include cycle overview specific filters (create mutable copies)
      activeFilters.stages = viewFilters.cycleOverview.stages
        ? [...viewFilters.cycleOverview.stages]
        : undefined;
      activeFilters.assignees = viewFilters.cycleOverview.assignees
        ? [...viewFilters.cycleOverview.assignees]
        : undefined;
      activeFilters.cycle = viewFilters.cycleOverview.cycle;
    } else if (currentView === "roadmap") {
      // Include roadmap specific filters (currently none)
      // No additional filters for roadmap view
    }

    return activeFilters;
  };

  /**
   * Get all view filters (for debugging/state management)
   * Returns readonly copy (ViewFilterCriteria uses readonly arrays)
   */
  const getAllViewFilters = (): ViewFilterCriteria => {
    // ViewFilterCriteria expects readonly arrays, so we can return them directly
    // but need to ensure they're proper readonly arrays
    return {
      common: {
        ...viewFilters.common,
        initiatives: viewFilters.common.initiatives
          ? (viewFilters.common.initiatives as readonly InitiativeId[])
          : undefined,
      },
      cycleOverview: {
        ...viewFilters.cycleOverview,
        stages: viewFilters.cycleOverview.stages
          ? (viewFilters.cycleOverview.stages as readonly StageId[])
          : undefined,
        assignees: viewFilters.cycleOverview.assignees
          ? (viewFilters.cycleOverview.assignees as readonly PersonId[])
          : undefined,
      },
      roadmap: { ...viewFilters.roadmap },
    } as ViewFilterCriteria;
  };

  /**
   * Set all view filters (for state restoration)
   */
  const setAllViewFilters = (filters: ViewFilterCriteria): void => {
    // Create mutable copy for internal state (convert readonly arrays to mutable)
    viewFilters = createMutableFilters(filters);
  };

  /**
   * Reset view-specific filters for a given view
   */
  const resetViewSpecificFilters = (pageId: PageId): void => {
    if (pageId === "cycle-overview") {
      viewFilters = {
        ...viewFilters,
        cycleOverview: {},
      };
    } else if (pageId === "roadmap") {
      viewFilters = {
        ...viewFilters,
        roadmap: {},
      };
    }
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = (): void => {
    viewFilters = {
      common: {},
      cycleOverview: {},
      roadmap: {},
    };
  };

  // Return immutable manager object
  return {
    switchView,
    getCurrentView,
    updateFilter,
    getActiveFilters,
    getAllViewFilters,
    setAllViewFilters,
    resetViewSpecificFilters,
    clearAllFilters,
  };
}

// Legacy class export for backward compatibility (deprecated)
// Use createViewFilterManager() factory function instead
export class ViewFilterManagerClass implements ViewFilterManager {
  private manager: ViewFilterManager;

  constructor(config: OmegaConfig) {
    this.manager = createViewFilterManager(config);
  }

  switchView(pageId: PageId): TypedFilterCriteria {
    return this.manager.switchView(pageId);
  }

  getCurrentView(): PageId {
    return this.manager.getCurrentView();
  }

  updateFilter(filterKey: FilterKey, value: unknown): TypedFilterCriteria {
    return this.manager.updateFilter(filterKey, value);
  }

  getActiveFilters(): TypedFilterCriteria {
    return this.manager.getActiveFilters();
  }

  getAllViewFilters(): ViewFilterCriteria {
    return this.manager.getAllViewFilters();
  }

  setAllViewFilters(filters: ViewFilterCriteria): void {
    return this.manager.setAllViewFilters(filters);
  }

  resetViewSpecificFilters(pageId: PageId): void {
    return this.manager.resetViewSpecificFilters(pageId);
  }

  clearAllFilters(): void {
    return this.manager.clearAllFilters();
  }
}
