/**
 * Vuex Store - COMMENTED OUT
 *
 * This is the main Vuex store that manages the application state.
 * It handles data fetching, processing, filtering, and UI state.
 *
 * NOTE: This store has been migrated to Pinia. See src/stores/ for the new Pinia stores.
 * This file is commented out to reduce bundle size and avoid conflicts.
 *
 * To restore Vuex functionality, uncomment this file and update main.ts accordingly.
 */

/*
import { createStore, ActionContext } from "vuex";
import { CycleDataService } from "../services/index";
import { logger } from "@omega/utils";
import { DataTransformer } from "../lib/transformers/data-transformer";
import { filter } from "../lib/utils/filter";
import { createViewFilterManager } from "../services/view-filter-manager";
import {
  calculateReleaseItemProgress,
  calculateCycleMetadata,
  aggregateProgressMetrics,
} from "../lib/calculations/cycle-calculations";
import type { OmegaConfig } from "@omega/config";
import type { Router } from "vue-router";
import type {
  Cycle,
  CycleId,
  CycleData,
  Person,
  Initiative,
  Area,
  Stage,
  RoadmapItem,
  ReleaseItem,
  NestedCycleData,
  RoadmapData,
  CycleOverviewData,
} from "@omega/types";
import type { FilterCriteria, ViewFilterCriteria } from "../types/ui-types";

// ... rest of the Vuex store code would be here ...
*/

// Export a placeholder function for compatibility
export default function createAppStore() {
  console.warn(
    "Vuex store is commented out. Using Pinia stores instead. See src/stores/ for the new implementation.",
  );
  return {
    dispatch: () => Promise.resolve(),
    commit: () => {},
    getters: {},
    state: {},
  };
}
