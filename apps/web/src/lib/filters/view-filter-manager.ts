/**
 * View Filter Manager
 *
 * Manages view-specific filtering logic to ensure that:
 * 1. Common filters (area, initiatives) are preserved when switching views
 * 2. View-specific filters are reset when switching to incompatible views
 * 3. Filter state is maintained appropriately for each view
 */

import type { FilterCriteria, ViewFilterCriteria } from "../../types/ui-types";
import type {
  AreaId,
  InitiativeId,
  StageId,
  PersonId,
  CycleId,
} from "@omega/types";

export type ViewType = "cycle-overview" | "roadmap";

/**
 * View Filter Manager class
 */
export class ViewFilterManager {
  private currentView: ViewType = "cycle-overview";
  private viewFilters: ViewFilterCriteria = {
    common: {},
    cycleOverview: {},
    roadmap: {},
  };

  /**
   * Switch to a new view and return appropriate filters
   */
  switchView(newView: ViewType): FilterCriteria {
    this.currentView = newView;
    return this.getActiveFilters();
  }

  /**
   * Get the current view
   */
  getCurrentView(): ViewType {
    return this.currentView;
  }

  /**
   * Update a filter for the current view
   */
  updateFilter(key: string, value: any): FilterCriteria {
    if (this.isCommonFilter(key)) {
      if (value === undefined) {
        delete this.viewFilters.common[
          key as keyof typeof this.viewFilters.common
        ];
      } else {
        this.viewFilters.common[key as keyof typeof this.viewFilters.common] =
          value;
      }
    } else if (this.isCycleOverviewFilter(key)) {
      if (value === undefined) {
        delete this.viewFilters.cycleOverview[
          key as keyof typeof this.viewFilters.cycleOverview
        ];
      } else {
        this.viewFilters.cycleOverview[
          key as keyof typeof this.viewFilters.cycleOverview
        ] = value;
      }
    } else if (this.isRoadmapFilter(key)) {
      if (value === undefined) {
        delete (this.viewFilters.roadmap as any)[key];
      } else {
        (this.viewFilters.roadmap as any)[key] = value;
      }
    }

    return this.getActiveFilters();
  }

  /**
   * Get active filters for the current view
   */
  getActiveFilters(): FilterCriteria {
    const activeFilters: FilterCriteria = {
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
   * Check if a filter key belongs to common filters
   */
  private isCommonFilter(key: string): boolean {
    return ["area", "initiatives", "assignees"].includes(key);
  }

  /**
   * Check if a filter key belongs to cycle overview filters
   */
  private isCycleOverviewFilter(key: string): boolean {
    return ["stages", "cycle"].includes(key);
  }

  /**
   * Check if a filter key belongs to roadmap filters
   */
  private isRoadmapFilter(key: string): boolean {
    // Currently no roadmap-specific filters
    return false;
  }

  /**
   * Reset view-specific filters for a given view
   */
  resetViewSpecificFilters(view: ViewType): void {
    if (view === "cycle-overview") {
      this.viewFilters.cycleOverview = {};
    } else if (view === "roadmap") {
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

// Export singleton instance
export const viewFilterManager = new ViewFilterManager();
