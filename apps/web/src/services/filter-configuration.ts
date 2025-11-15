/**
 * Filter Configuration Service
 *
 * Provides type-safe configuration for the filter system based on HeadNorthConfig.
 * This service defines which filters are available for which views and their types.
 */

import { Either, Left, Right } from "purify-ts";
import type { HeadNorthConfig } from "@headnorth/config";
import type {
  FilterConfiguration,
  FilterCategory,
  FilterKey,
  PageId,
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
    key: "objectives",
    type: "common",
    views: ["cycle-overview", "roadmap"],
    description: "Filter by objectives",
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
  {
    key: "showValidationErrors",
    type: "common",
    views: ["cycle-overview", "roadmap"],
    description: "Show only items with validation errors",
  },
];

/**
 * Build the view filter configuration from filter categories
 * Pure function - uses reduce for immutable transformation
 */
function buildViewFilterConfig(
  filterCategories: readonly FilterCategory[],
): ViewFilterConfig {
  const initialConfig: ViewFilterConfig = {
    common: [],
    specific: {
      root: [],
      "cycle-overview": [],
      roadmap: [],
    },
  };

  return filterCategories.reduce((acc, category) => {
    if (category.type === "common") {
      return {
        ...acc,
        common: [...acc.common, category.key],
      };
    }

    // Add to specific filters for each view that supports it
    const updatedSpecific = category.views.reduce((specificAcc, view) => {
      if (!specificAcc[view]) {
        return { ...specificAcc, [view]: [] };
      }
      return {
        ...specificAcc,
        [view]: [...specificAcc[view], category.key],
      };
    }, acc.specific);

    return {
      ...acc,
      specific: updatedSpecific,
    };
  }, initialConfig);
}

/**
 * Validate that all configured pages exist in HeadNorthConfig
 * Pure function - validates page configuration
 * Returns Either<Error, void> - Left if validation fails, Right if valid
 */
function validatePageConfiguration(
  filterCategories: readonly FilterCategory[],
  config: HeadNorthConfig,
): Either<Error, void> {
  // Collect all pages referenced in filter categories (immutable)
  const configuredPages = new Set<PageId>(
    filterCategories.flatMap((category) => category.views),
  );

  // Check that all referenced page IDs exist in OmegaConfig
  // We need to check against the actual page.id values, not the page keys
  const allPages = config.getFrontendConfig().getAllPages();
  const pageIds = allPages.map((page) => page.id);

  const invalidPages = Array.from(configuredPages).filter(
    (pageId) => !pageIds.includes(pageId),
  );

  if (invalidPages.length > 0) {
    return Left(
      new Error(
        `Filter configuration references page(s) '${invalidPages.join(", ")}' which do not exist in HeadNorthConfig. Available pages: ${pageIds.join(", ")}`,
      ),
    );
  }

  return Right(undefined);
}

/**
 * Filter Configuration Service
 *
 * Factory function that provides type-safe access to filter definitions and rules.
 * Returns an immutable configuration object with pure functional methods.
 */
export function createFilterConfigurationService(
  config: HeadNorthConfig,
): FilterConfiguration {
  // Immutable configuration data
  const filterCategories = [...DEFAULT_FILTER_CATEGORIES] as const;
  const viewFilterConfig = buildViewFilterConfig(filterCategories);

  // Validate that all configured pages exist in HeadNorthConfig
  // Fail-fast on configuration errors (this is called at service creation time
  const validationResult = validatePageConfiguration(filterCategories, config);
  validationResult.caseOf({
    Left: (error) => {
      // Configuration errors should fail-fast - this is a startup validation
      throw error;
    },
    Right: () => {
      // Validation passed, continue
    },
  });

  /**
   * Get filters available for a specific page/view
   */
  const getViewFilters = (pageId: PageId): FilterKey[] => {
    const commonFilters = viewFilterConfig.common;
    const specificFilters = viewFilterConfig.specific[pageId] || [];

    return [...commonFilters, ...specificFilters];
  };

  /**
   * Check if a filter is common across all views
   */
  const isCommonFilter = (filterKey: FilterKey): boolean => {
    const category = filterCategories.find((cat) => cat.key === filterKey);
    return category?.type === "common" || false;
  };

  /**
   * Validate that a filter key is valid for a specific view
   */
  const isValidFilterForView = (
    filterKey: FilterKey,
    pageId: PageId,
  ): boolean => {
    const availableFilters = getViewFilters(pageId);
    return availableFilters.includes(filterKey);
  };

  const service: FilterConfiguration = {
    getViewFilters,
    isCommonFilter,
    isValidFilterForView,
  };

  return service;
}
