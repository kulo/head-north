/**
 * Store Registry
 *
 * Provides a way for components to access stores created with factory functions
 * while maintaining the familiar useStore() API.
 */

import { createDataStore } from "./data";
import { createFilterStore } from "./filters";
import { createAppStore } from "./app";
import { createValidationStore } from "./validation";
import type { default as CycleDataService } from "../services/cycle-data-service";
import type { ViewFilterManager } from "../services/view-filter-manager";
import type { CycleDataViewCoordinator } from "../services/cycle-data-view-coordinator";
import type { Router } from "vue-router";
import type { OmegaConfig } from "@omega/config";

// Store instances (will be set when stores are created)
let dataStoreInstance: ReturnType<typeof createDataStore> | null = null;
let filterStoreInstance: ReturnType<typeof createFilterStore> | null = null;
let appStoreInstance: ReturnType<typeof createAppStore> | null = null;
let validationStoreInstance: ReturnType<typeof createValidationStore> | null =
  null;

/**
 * Initialize stores with services
 */
export function initializeStores(services: {
  cycleDataService: CycleDataService;
  viewFilterManager: ViewFilterManager;
  cycleDataViewCoordinator: CycleDataViewCoordinator;
  router: Router;
  config: OmegaConfig;
}) {
  const {
    cycleDataService,
    viewFilterManager,
    cycleDataViewCoordinator,
    router,
    config,
  } = services;

  // Create store instances
  dataStoreInstance = createDataStore(
    cycleDataService,
    cycleDataViewCoordinator,
  );
  filterStoreInstance = createFilterStore(viewFilterManager, router);
  appStoreInstance = createAppStore(config);
  validationStoreInstance = createValidationStore(config);

  console.log("✅ Stores initialized with factory functions");
}

/**
 * Store accessors for components
 */
export function useDataStore() {
  if (!dataStoreInstance) {
    throw new Error(
      "Data store not initialized. Call initializeStores() first.",
    );
  }
  return dataStoreInstance();
}

export function useFilterStore() {
  if (!filterStoreInstance) {
    throw new Error(
      "Filter store not initialized. Call initializeStores() first.",
    );
  }
  return filterStoreInstance();
}

export function useAppStore() {
  if (!appStoreInstance) {
    throw new Error(
      "App store not initialized. Call initializeStores() first.",
    );
  }
  return appStoreInstance();
}

export function useValidationStore() {
  if (!validationStoreInstance) {
    throw new Error(
      "Validation store not initialized. Call initializeStores() first.",
    );
  }
  return validationStoreInstance();
}
