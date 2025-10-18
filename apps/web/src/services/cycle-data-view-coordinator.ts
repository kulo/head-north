/**
 * Cycle Data View Coordinator
 *
 * Business operations service that coordinates cycle data processing and view management.
 * Handles stateful operations and side effects, coordinating between pure data transformations
 * and external systems (filter manager).
 *
 * This belongs in /services because it manages state and has side effects.
 */

import { DataTransformer } from "../lib/transformers/data-transformer";
import type { ViewFilterManager } from "./view-filter-manager";
import type { CycleData } from "@omega/types";
import type {
  NestedCycleData,
  RoadmapData,
  CycleOverviewData,
  ViewFilterCriteria,
} from "../types/ui-types";
import type { FilterKey, PageId } from "../types/filter-types";
import type { OmegaConfig } from "@omega/config";

export class CycleDataViewCoordinator {
  constructor(
    private viewFilterManager: ViewFilterManager,
    private config: OmegaConfig,
  ) {
    // Set config for DataTransformer
    DataTransformer.setConfig(config);
  }
  /**
   * Process raw cycle data into nested structure
   * Business operation - coordinates pure transformation
   */
  processCycleData(rawData: CycleData): NestedCycleData {
    if (!rawData) {
      throw new Error("Raw data is required");
    }

    console.log("Processing data with DataTransformer");
    const processedData = DataTransformer.processCycleData(rawData, {});

    if (!processedData) {
      throw new Error("Data processing failed");
    }

    console.log("Data processed successfully", {
      initiatives: processedData.initiatives?.length || 0,
    });

    return processedData;
  }

  /**
   * Generate roadmap data from raw and processed data
   * Business operation - coordinates pure transformation
   */
  generateRoadmapData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
  ): RoadmapData {
    return DataTransformer.generateRoadmapData(rawData, processedData);
  }

  /**
   * Generate cycle overview data from raw and processed data
   * Business operation - coordinates pure transformation
   */
  generateCycleOverviewData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
  ): CycleOverviewData | null {
    return DataTransformer.generateCycleOverviewData(rawData, processedData);
  }

  /**
   * Generate filtered roadmap data
   * Business operation - coordinates with filter manager and pure transformation
   */
  generateFilteredRoadmapData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
  ): RoadmapData {
    const activeFilters = this.viewFilterManager.getActiveFilters();
    return DataTransformer.generateFilteredRoadmapData(
      rawData,
      processedData,
      activeFilters,
    );
  }

  /**
   * Generate filtered cycle overview data with progress calculations
   * Business operation - coordinates with filter manager and pure transformation
   */
  generateFilteredCycleOverviewData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
  ): CycleOverviewData | null {
    const activeFilters = this.viewFilterManager.getActiveFilters();
    return DataTransformer.generateFilteredCycleOverviewData(
      rawData,
      processedData,
      activeFilters,
    );
  }

  /**
   * Update filters using ViewFilterManager
   * Business operation - has side effects (updates filter manager state)
   */
  updateFilter(filterKey: FilterKey, value: unknown): ViewFilterCriteria {
    this.viewFilterManager.updateFilter(filterKey, value);
    return this.viewFilterManager.getAllViewFilters();
  }

  /**
   * Switch view and return updated filters
   * Business operation - has side effects (updates filter manager state)
   */
  switchView(pageId: PageId): ViewFilterCriteria {
    this.viewFilterManager.switchView(pageId);
    return this.viewFilterManager.getAllViewFilters();
  }

  /**
   * Initialize filters with ViewFilterManager
   * Business operation - has side effects (initializes filter manager state)
   */
  initializeFilters(currentFilters: ViewFilterCriteria): void {
    this.viewFilterManager.setAllViewFilters(currentFilters);
    console.log("Filters initialized with ViewFilterManager");
  }
}

/**
 * Factory function to create CycleDataViewCoordinator with dependencies
 * This replaces the singleton pattern with proper dependency injection
 */
export function createCycleDataViewCoordinator(
  viewFilterManager: ViewFilterManager,
  config: OmegaConfig,
): CycleDataViewCoordinator {
  return new CycleDataViewCoordinator(viewFilterManager, config);
}
