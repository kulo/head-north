import { createApp } from "vue";
import App from "./App.vue";
import createAppRouter from "./router/index";
import createUnifiedStore from "./store/unified-store";
import { CycleDataService } from "./services/index";
import { OmegaConfig } from "@omega/config";
import { logger } from "@omega/utils";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";
import "./assets/css/style.css";
import VueApexCharts from "vue3-apexcharts";

// Create services
const omegaConfig = new OmegaConfig({
  overrides: { environment: (import.meta as any).env?.MODE || "development" },
});
const cycleDataService = new CycleDataService(omegaConfig);

// Create the Vue app
const app = createApp(App);

// Add router, store, and Ant Design Vue
const router = createAppRouter(omegaConfig);
app.use(router);
const store = createUnifiedStore(cycleDataService, omegaConfig, router);
app.use(store);

app.use(Antd);
app.use(VueApexCharts);

// Mount the app
try {
  app.mount("#app");

  // Initialize data after mounting
  store.dispatch("fetchAndProcessData");

  // Initialize ViewFilterManager with store state
  store.dispatch("initializeFilters");

  logger.default.info("Omega One frontend started successfully!");
} catch (error) {
  const errorMessage = error?.message || error?.toString() || "Unknown error";
  logger.error.errorSafe("Error mounting Vue app", error);
}
