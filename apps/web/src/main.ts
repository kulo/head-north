import { createApp } from "vue";
import App from "./App.vue";
import createAppRouter from "./router/index";
import { CycleDataService } from "./services/index";
import { createViewFilterManager } from "./services/view-filter-manager";
import { createCycleDataViewCoordinator } from "./services/cycle-data-view-coordinator";
import { HeadNorthConfig } from "@headnorth/config";
import { logger } from "@headnorth/utils";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";
import "./assets/css/style.css";
import VueApexCharts from "vue3-apexcharts";
import {
  useAppStore,
  useDataStore,
  useValidationStore,
  useFilterStore,
} from "./stores/index";

// Pinia imports
import { createPinia } from "pinia";

// Create services
const headNorthConfig = new HeadNorthConfig({
  overrides: {
    environment:
      (import.meta as { env?: { MODE?: string } }).env?.MODE || "development",
  },
});
const cycleDataService = new CycleDataService(headNorthConfig);

// Create filter services with dependency injection
const viewFilterManager = createViewFilterManager(headNorthConfig);
const cycleDataViewCoordinator = createCycleDataViewCoordinator(
  viewFilterManager,
  headNorthConfig,
);

// Create the Vue app
const app = createApp(App);

// Create Pinia instance
const pinia = createPinia();

// Add router, Pinia, and Ant Design Vue
const router = createAppRouter(headNorthConfig);
app.use(router);
app.use(pinia);

// Provide services for dependency injection
app.provide("config", headNorthConfig);
app.provide("dataService", cycleDataService);
app.provide("filterManager", viewFilterManager);
app.provide("coordinator", cycleDataViewCoordinator);
app.provide("router", router);

app.use(Antd);
app.use(VueApexCharts);

// Initialize app
async function initializeApp() {
  try {
    // Mount the app
    app.mount("#app");

    const appStore = useAppStore();
    const dataStore = useDataStore();
    const validationStore = useValidationStore();
    const filterStore = useFilterStore();

    // Initialize stores
    appStore.initializeApp();
    validationStore.initializeValidation();
    filterStore.initializeFilters();

    // Fetch initial data
    await dataStore.fetchAndProcessData();

    logger.default.info("Head North frontend started successfully with Pinia!");
  } catch (error) {
    logger.error.errorSafe("Error initializing Pinia app", error);
  }
}

// Initialize the application
initializeApp();
