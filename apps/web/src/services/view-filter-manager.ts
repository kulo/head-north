/**
 * View Filter Manager
 *
 * Manages view-specific filtering logic with type safety and dependency injection.
 * Ensures that:
 * 1. Common filters (area, initiatives) are preserved when switching views
 * 2. View-specific filters are reset when switching to incompatible views
 * 3. Filter state is maintained appropriately for each view
 * 4. All operations are type-safe and validated
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
  ViewFilterManager as IViewFilterManager,
  FilterKey,
  PageId,
  TypedFilterCriteria,
} from "../types/filter-types";
import { FilterConfigurationService } from "./filter-configuration";

/**
 * View Filter Manager class with dependency injection and type safety
 */
// Internal mutable type for filter state (matches ViewFilterCriteria but mutable)
type MutableViewFilterCriteria = {
  common: {
    area?: AreaId;
    initiatives?: InitiativeId[];
  };
  cycleOverview: {
    stages?: StageId[];
    assignees?: PersonId[];
    cycle?: CycleId;
  };
  roadmap: Record<string, never>;
};

export class ViewFilterManager implements IViewFilterManager {
  private currentView: PageId = "cycle-overview";
  private viewFilters: MutableViewFilterCriteria = {
    common: {},
    cycleOverview: {},
    roadmap: {},
  };
  private filterConfig: FilterConfigurationService;

  constructor(config: OmegaConfig) {
    this.filterConfig = new FilterConfigurationService(config);
  }

  /**
   * Switch to a new view and return appropriate filters
   */
  switchView(pageId: PageId): TypedFilterCriteria {
    // Validate that the page exists in configuration
    if (!this.filterConfig.getViewFilters(pageId).length && pageId !== "root") {
      console.warn(`No filters configured for page: ${pageId}`);
    }

    this.currentView = pageId;
    return this.getActiveFilters();
  }

  /**
   * Get the current view
   */
  getCurrentView(): PageId {
    return this.currentView;
  }

  /**
   * Update a filter for the current view
   */
  updateFilter(filterKey: FilterKey, value: unknown): TypedFilterCriteria {
    // Validate that this filter is valid for the current view
    if (!this.filterConfig.isValidFilterForView(filterKey, this.currentView)) {
      throw new Error(
        `Filter '${filterKey}' is not valid for view '${this.currentView}'`,
      );
    }

    // Helper to convert value to mutable array if needed
    const makeMutableValue = (val: unknown): unknown => {
      if (Array.isArray(val)) {
        return [...val]; // Create mutable copy
      }
      return val;
    };

    if (this.filterConfig.isCommonFilter(filterKey)) {
      // Update common filter - create new object to ensure reactivity
      this.viewFilters = {
        ...this.viewFilters,
        common: {
          ...this.viewFilters.common,
          [filterKey]:
            value === undefined ? undefined : makeMutableValue(value),
        },
      };
    } else {
      // Update view-specific filter
      if (this.currentView === "cycle-overview") {
        this.viewFilters = {
          ...this.viewFilters,
          cycleOverview: {
            ...this.viewFilters.cycleOverview,
            [filterKey]:
              value === undefined ? undefined : makeMutableValue(value),
          },
        };
      } else if (this.currentView === "roadmap") {
        // Roadmap filters are currently empty, but handle for future extensibility
        this.viewFilters = {
          ...this.viewFilters,
          roadmap: {} as Record<string, never>,
        };
      }
    }

    return this.getActiveFilters();
  }

  /**
   * Get active filters for the current view
   */
  getActiveFilters(): TypedFilterCriteria {
    const activeFilters: TypedFilterCriteria = {
      ...this.viewFilters.common,
    };

    if (this.currentView === "cycle-overview") {
      // Include cycle overview specific filters
      Object.assign(activeFilters, this.viewFilters.cycleOverview);
    } else if (this.currentView === "roadmap") {
      // Include roadmap specific filters (currently none)
      Object.assign(activeFilters, this.viewFilters.roadmap);
    }

    return activeFilters;
  }

  /**
   * Get all view filters (for debugging/state management)
   */
  getAllViewFilters(): ViewFilterCriteria {
    // Create readonly copy when returning
    return {
      common: {
        ...this.viewFilters.common,
        initiatives: this.viewFilters.common.initiatives
          ? [...this.viewFilters.common.initiatives]
          : undefined,
      },
      cycleOverview: {
        ...this.viewFilters.cycleOverview,
        stages: this.viewFilters.cycleOverview.stages
          ? [...this.viewFilters.cycleOverview.stages]
          : undefined,
        assignees: this.viewFilters.cycleOverview.assignees
          ? [...this.viewFilters.cycleOverview.assignees]
          : undefined,
      },
      roadmap: { ...this.viewFilters.roadmap },
    } as ViewFilterCriteria;
  }

  /**
   * Set all view filters (for state restoration)
   */
  setAllViewFilters(filters: ViewFilterCriteria): void {
    // Create mutable copy (convert readonly arrays to mutable)
    this.viewFilters = {
      common: {
        ...filters.common,
        initiatives: filters.common.initiatives
          ? [...filters.common.initiatives]
          : undefined,
      },
      cycleOverview: {
        ...filters.cycleOverview,
        stages: filters.cycleOverview.stages
          ? [...filters.cycleOverview.stages]
          : undefined,
        assignees: filters.cycleOverview.assignees
          ? [...filters.cycleOverview.assignees]
          : undefined,
      },
      roadmap: { ...filters.roadmap },
    };
  }

  /**
   * Get filter configuration for debugging/logging
   */
  getFilterConfiguration() {
    return this.filterConfig.getFilterMetadata();
  }

  /**
   * Reset view-specific filters for a given view
   */
  resetViewSpecificFilters(pageId: PageId): void {
    if (pageId === "cycle-overview") {
      this.viewFilters = {
        ...this.viewFilters,
        cycleOverview: {},
      };
    } else if (pageId === "roadmap") {
      this.viewFilters = {
        ...this.viewFilters,
        roadmap: {},
      };
    }
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.viewFilters = {
      common: {},
      cycleOverview: {},
      roadmap: {},
    };
  }
}

/**
 * Factory function to create ViewFilterManager with dependencies
 * This replaces the singleton pattern with proper dependency injection
 */
export function createViewFilterManager(
  config: OmegaConfig,
): ViewFilterManager {
  return new ViewFilterManager(config);
}
