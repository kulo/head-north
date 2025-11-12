/**
 * Strongly-Typed Filter System Types
 *
 * This module provides type-safe interfaces for the filter system,
 * ensuring compile-time safety and consistency with OmegaConfig.
 */

import type { Either } from "purify-ts";
import type { ViewFilterCriteria } from "./ui-types";
import type {
  AreaId,
  InitiativeId,
  StageId,
  PersonId,
  CycleId,
} from "@omega/types";

// ============================================================================
// Core Type Definitions
// ============================================================================

/**
 * Page IDs from OmegaConfig - strongly typed to prevent typos
 * These are the actual page.id values used in the UI, not the page keys
 */
export type PageId = "root" | "cycle-overview" | "roadmap";

/**
 * Filter keys from FilterCriteria - strongly typed for type safety
 */
export type FilterKey =
  | "area"
  | "initiatives"
  | "stages"
  | "assignees"
  | "cycle"
  | "showValidationErrors";

/**
 * Filter types - common filters are shared across views, specific filters are view-only
 */
export type FilterType = "common" | "view-specific";

// ============================================================================
// Filter Configuration Types
// ============================================================================

/**
 * Individual filter category definition
 */
export interface FilterCategory {
  /** The filter key */
  key: FilterKey;
  /** Whether this filter is common across views or view-specific */
  type: FilterType;
  /** Which pages/views this filter applies to */
  views: PageId[];
  /** Human-readable description */
  description: string;
}

/**
 * View-specific filter configuration
 */
export interface ViewFilterConfig {
  /** Common filters shared across all views */
  common: FilterKey[];
  /** View-specific filters by page ID */
  specific: Record<PageId, FilterKey[]>;
}

/**
 * Strongly-typed filter values
 */
export interface TypedFilterCriteria {
  area?: AreaId;
  initiatives?: InitiativeId[];
  stages?: StageId[];
  assignees?: PersonId[];
  cycle?: CycleId;
  showValidationErrors?: boolean;
}

// ============================================================================
// Filter Configuration Interface
// ============================================================================

/**
 * Configuration service for filter system
 * Provides type-safe access to filter definitions and rules
 */
export interface FilterConfiguration {
  /**
   * Get filters available for a specific page/view
   * @param pageId - The page ID (strongly typed)
   * @returns Array of filter keys available for this view
   */
  getViewFilters(pageId: PageId): FilterKey[];

  /**
   * Check if a filter is common across all views
   * @param filterKey - The filter key (strongly typed)
   * @returns True if this is a common filter
   */
  isCommonFilter(filterKey: FilterKey): boolean;

  /**
   * Validate that a filter key is valid for a specific view
   * @param filterKey - The filter key to validate
   * @param pageId - The page ID to check against
   * @returns True if the filter is valid for this view
   */
  isValidFilterForView(filterKey: FilterKey, pageId: PageId): boolean;
}

// ============================================================================
// View Filter Manager Interface
// ============================================================================

/**
 * View Filter Manager interface
 * Defines the contract for managing view-specific filtering
 */
export interface ViewFilterManager {
  /**
   * Switch to a new view and return appropriate filters
   * @param pageId - The page ID to switch to (strongly typed)
   * @returns Active filters for the new view
   */
  switchView(pageId: PageId): TypedFilterCriteria;

  /**
   * Get the current view/page ID
   */
  getCurrentView(): PageId;

  /**
   * Update a filter for the current view
   * @param filterKey - The filter key (strongly typed)
   * @param value - The filter value
   * @returns Either<Error, TypedFilterCriteria> - Left if filter is invalid for view, Right with updated filters
   */
  updateFilter(
    filterKey: FilterKey,
    value: unknown,
  ): Either<Error, TypedFilterCriteria>;

  /**
   * Get active filters for the current view
   */
  getActiveFilters(): TypedFilterCriteria;

  /**
   * Get all view filters (for debugging/state management)
   */
  getAllViewFilters(): ViewFilterCriteria;

  /**
   * Set all view filters (for state restoration)
   * @param filters - The complete filter state
   */
  setAllViewFilters(filters: ViewFilterCriteria): void;

  /**
   * Reset view-specific filters for a given view
   * @param pageId - The page ID to reset filters for
   */
  resetViewSpecificFilters(pageId: PageId): void;

  /**
   * Clear all filters
   */
  clearAllFilters(): void;
}

// ============================================================================
// Legacy Compatibility Types
// ============================================================================

// ViewFilterCriteria is now imported from ui-types.ts
// This export is kept for backward compatibility only
export type { ViewFilterCriteria };
