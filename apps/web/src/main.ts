import { createApp } from "vue";
import App from "./App.vue";
import createAppRouter from "./router/index";
import { CycleDataService } from "./services/index";
import { createViewFilterManager } from "./services/view-filter-manager";
import { createCycleDataViewCoordinator } from "./services/cycle-data-view-coordinator";
import { OmegaConfig } from "@omega/config";
import { logger } from "@omega/utils";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";
import "./assets/css/style.css";
import VueApexCharts from "vue3-apexcharts";

// Pinia imports
import { createPinia } from "pinia";
import { initializeStores } from "./stores/registry";

// Create services
const omegaConfig = new OmegaConfig({
  overrides: { environment: (import.meta as any).env?.MODE || "development" },
});
const cycleDataService = new CycleDataService(omegaConfig);

// Create filter services with dependency injection
const viewFilterManager = createViewFilterManager(omegaConfig);
const cycleDataViewCoordinator =
  createCycleDataViewCoordinator(viewFilterManager);

// Create the Vue app
const app = createApp(App);

// Create Pinia instance
const pinia = createPinia();

// Add router, Pinia, and Ant Design Vue
const router = createAppRouter(omegaConfig);
app.use(router);
app.use(pinia);

app.use(Antd);
app.use(VueApexCharts);

// Initialize Pinia services
async function initializeApp() {
  try {
    // Initialize stores with immutable service injection
    initializeStores({
      cycleDataService,
      viewFilterManager,
      cycleDataViewCoordinator,
      router,
      config: omegaConfig,
    });

    // Mount the app
    app.mount("#app");

    // Initialize stores and fetch data
    const { useAppStore, useDataStore, useValidationStore, useFilterStore } =
      await import("./stores/registry");

    const appStore = useAppStore();
    const dataStore = useDataStore();
    const validationStore = useValidationStore();
    const filterStore = useFilterStore();

    // Initialize stores
    appStore.initializeApp();
    validationStore.initializeValidation();
    filterStore.initializeFilters();

    // Fetch initial data
    await dataStore.fetchAndProcessData(appStore);

    logger.default.info("Omega One frontend started successfully with Pinia!");
  } catch (error) {
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    logger.error.errorSafe("Error initializing Pinia app", error);
  }
}

// Initialize the application
initializeApp();
