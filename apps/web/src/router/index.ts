import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import UnifiedCycleOverview from "@/components/cycles/UnifiedCycleOverview.vue";
import UnifiedRoadmap from "@/components/roadmap/UnifiedRoadmap.vue";
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
      component: UnifiedCycleOverview,
    },
    {
      path: pages.ROADMAP.path,
      component: UnifiedRoadmap,
    },
  ];

  return createRouter({
    history: createWebHistory(),
    routes,
  });
}
