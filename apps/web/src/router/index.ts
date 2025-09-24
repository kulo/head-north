import { createRouter, createWebHistory } from "vue-router";
import CycleOverview from "@/components/cycles/CycleOverview.vue";
import Roadmap from "@/components/roadmap/Roadmap.vue";
import type { OmegaConfig } from "@omega/config";

// Router factory function that accepts OmegaConfig
export default function createAppRouter(omegaConfig: OmegaConfig) {
  const pages = omegaConfig.getFrontendConfig().pages;

  const routes = [
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
