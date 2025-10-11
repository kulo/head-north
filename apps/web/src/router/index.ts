import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
// Using Pinia versions of components
import CycleOverview from "@/components/cycles/CycleOverview-pinia.vue";
import Roadmap from "@/components/roadmap/Roadmap-pinia.vue";

// COMMENTED OUT - Original Vuex components
// import CycleOverview from "@/components/cycles/CycleOverview.vue";
// import Roadmap from "@/components/roadmap/Roadmap.vue";
import type { OmegaConfig } from "@omega/config";

// Router factory function that accepts OmegaConfig
export default function createAppRouter(omegaConfig: OmegaConfig) {
  const pages = omegaConfig.getFrontendConfig().pages;

  const routes: RouteRecordRaw[] = [
    {
      path: pages.ROOT.path,
      redirect: pages.CYCLE_OVERVIEW.path,
    },
    {
      path: pages.CYCLE_OVERVIEW.path,
      component: CycleOverview,
    },
    {
      path: pages.ROADMAP.path,
      component: Roadmap,
    },
  ];

  return createRouter({
    history: createWebHistory(),
    routes,
  });
}
