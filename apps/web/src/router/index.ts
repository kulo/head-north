import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import CycleOverview from "@/components/cycles/CycleOverview.vue";
import Roadmap from "@/components/roadmap/Roadmap.vue";
import type { HeadNorthConfig } from "@headnorth/config";

// Router factory function that accepts HeadNorthConfig
export default function createAppRouter(headNorthConfig: HeadNorthConfig) {
  const pages = headNorthConfig.getFrontendConfig().pages;

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
