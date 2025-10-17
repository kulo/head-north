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
export class ViewFilterManager implements IViewFilterManager {
  private currentView: PageId = "cycle-overview";
  private viewFilters: ViewFilterCriteria = {
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

    if (this.filterConfig.isCommonFilter(filterKey)) {
      // Update common filter
      if (value === undefined) {
        delete this.viewFilters.common[
          filterKey as keyof typeof this.viewFilters.common
        ];
      } else {
        this.viewFilters.common[
          filterKey as keyof typeof this.viewFilters.common
        ] = value as string[] & string;
      }
    } else {
      // Update view-specific filter
      if (this.currentView === "cycle-overview") {
        if (value === undefined) {
          delete this.viewFilters.cycleOverview[
            filterKey as keyof typeof this.viewFilters.cycleOverview
          ];
        } else {
          this.viewFilters.cycleOverview[
            filterKey as keyof typeof this.viewFilters.cycleOverview
          ] = value as string[] & string;
        }
      } else if (this.currentView === "roadmap") {
        if (value === undefined) {
          delete (this.viewFilters.roadmap as Record<string, unknown>)[
            filterKey
          ];
        } else {
          (this.viewFilters.roadmap as Record<string, unknown>)[filterKey] =
            value;
        }
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
    return { ...this.viewFilters };
  }

  /**
   * Set all view filters (for state restoration)
   */
  setAllViewFilters(filters: ViewFilterCriteria): void {
    this.viewFilters = { ...filters };
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
      this.viewFilters.cycleOverview = {};
    } else if (pageId === "roadmap") {
      this.viewFilters.roadmap = {};
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
