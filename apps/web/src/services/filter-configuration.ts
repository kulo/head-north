/**
 * Filter Configuration Service
 *
 * Provides type-safe configuration for the filter system based on OmegaConfig.
 * This service defines which filters are available for which views and their types.
 */

import type { OmegaConfig } from "@omega/config";
import type {
  FilterConfiguration,
  FilterCategory,
  FilterKey,
  PageId,
  FilterType,
  ViewFilterConfig,
} from "../types/filter-types";

/**
 * Default filter configuration based on current system
 * This can be extended or made configurable in the future
 */
const DEFAULT_FILTER_CATEGORIES: FilterCategory[] = [
  {
    key: "area",
    type: "common",
    views: ["cycle-overview", "roadmap"],
    description: "Filter by area/team",
  },
  {
    key: "initiatives",
    type: "common",
    views: ["cycle-overview", "roadmap"],
    description: "Filter by initiatives",
  },
  {
    key: "stages",
    type: "view-specific",
    views: ["cycle-overview"],
    description: "Filter by development stages",
  },
  {
    key: "assignees",
    type: "view-specific",
    views: ["cycle-overview"],
    description: "Filter by assignees/team members",
  },
  {
    key: "cycle",
    type: "view-specific",
    views: ["cycle-overview"],
    description: "Filter by specific cycle",
  },
];

/**
 * Filter Configuration Service Implementation
 *
 * Provides type-safe access to filter definitions and rules.
 * This service is stateless and can be safely shared across the application.
 */
export class FilterConfigurationService implements FilterConfiguration {
  private filterCategories: FilterCategory[];
  private viewFilterConfig: ViewFilterConfig;

  constructor(config: OmegaConfig) {
    this.filterCategories = DEFAULT_FILTER_CATEGORIES;
    this.viewFilterConfig = this.buildViewFilterConfig();

    // Validate that all configured pages exist in OmegaConfig
    this.validatePageConfiguration(config);
  }

  /**
   * Get all filter categories with their metadata
   */
  getFilterCategories(): FilterCategory[] {
    return [...this.filterCategories];
  }

  /**
   * Get filters available for a specific page/view
   */
  getViewFilters(pageId: PageId): FilterKey[] {
    const commonFilters = this.viewFilterConfig.common;
    const specificFilters = this.viewFilterConfig.specific[pageId] || [];

    return [...commonFilters, ...specificFilters];
  }

  /**
   * Check if a filter is common across all views
   */
  isCommonFilter(filterKey: FilterKey): boolean {
    const category = this.filterCategories.find((cat) => cat.key === filterKey);
    return category?.type === "common" || false;
  }

  /**
   * Get the type of a filter (common or view-specific)
   */
  getFilterType(filterKey: FilterKey): FilterType {
    const category = this.filterCategories.find((cat) => cat.key === filterKey);
    return category?.type ?? "view-specific";
  }

  /**
   * Get all views that support a specific filter
   */
  getViewsForFilter(filterKey: FilterKey): PageId[] {
    const category = this.filterCategories.find((cat) => cat.key === filterKey);
    return category?.views ?? [];
  }

  /**
   * Get the complete view filter configuration
   */
  getViewFilterConfig(): ViewFilterConfig {
    return { ...this.viewFilterConfig };
  }

  /**
   * Validate that a filter key is valid for a specific view
   */
  isValidFilterForView(filterKey: FilterKey, pageId: PageId): boolean {
    const availableFilters = this.getViewFilters(pageId);
    return availableFilters.includes(filterKey);
  }

  /**
   * Build the view filter configuration from filter categories
   * @private
   */
  private buildViewFilterConfig(): ViewFilterConfig {
    const common: FilterKey[] = [];
    const specific: Record<PageId, FilterKey[]> = {
      root: [],
      "cycle-overview": [],
      roadmap: [],
    };

    // Process each filter category
    for (const category of this.filterCategories) {
      if (category.type === "common") {
        common.push(category.key);
      } else {
        // Add to specific filters for each view that supports it
        for (const view of category.views) {
          if (!specific[view]) {
            specific[view] = [];
          }
          specific[view].push(category.key);
        }
      }
    }

    return { common, specific };
  }

  /**
   * Validate that all configured pages exist in OmegaConfig
   * @private
   */
  private validatePageConfiguration(config: OmegaConfig): void {
    const configuredPages = new Set<PageId>();

    // Collect all pages referenced in filter categories
    for (const category of this.filterCategories) {
      for (const view of category.views) {
        configuredPages.add(view);
      }
    }

    // Check that all referenced page IDs exist in OmegaConfig
    // We need to check against the actual page.id values, not the page keys
    const allPages = config.getFrontendConfig().getAllPages();
    const pageIds = allPages.map((page) => page.id);

    for (const pageId of configuredPages) {
      if (!pageIds.includes(pageId)) {
        throw new Error(
          `Filter configuration references page '${pageId}' which does not exist in OmegaConfig. Available pages: ${pageIds.join(", ")}`,
        );
      }
    }
  }

  /**
   * Get filter metadata for debugging/logging
   */
  getFilterMetadata(): {
    totalFilters: number;
    commonFilters: number;
    viewSpecificFilters: number;
    filtersByView: Record<PageId, number>;
  } {
    const commonFilters = this.filterCategories.filter(
      (cat) => cat.type === "common",
    ).length;
    const viewSpecificFilters = this.filterCategories.filter(
      (cat) => cat.type === "view-specific",
    ).length;

    const filtersByView: Record<PageId, number> = {
      root: 0,
      "cycle-overview": 0,
      roadmap: 0,
    };

    for (const pageId of Object.keys(filtersByView) as PageId[]) {
      filtersByView[pageId] = this.getViewFilters(pageId).length;
    }

    return {
      totalFilters: this.filterCategories.length,
      commonFilters,
      viewSpecificFilters,
      filtersByView,
    };
  }
}
