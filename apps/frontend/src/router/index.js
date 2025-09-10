import { createRouter, createWebHistory } from 'vue-router'
import CycleOverview from '@/components/cycles-overview/CycleOverview.vue'
import ReleaseOverview from '@/components/roadmap/ReleaseOverview.vue'

// Router factory function that accepts OmegaConfig
export default function createAppRouter(omegaConfig) {
  const pages = omegaConfig.getFrontendConfig().pages

  const routes = [
    { 
      path: pages.ROOT.path, 
      redirect: pages.CYCLE_OVERVIEW.path 
    },
    { 
      path: pages.CYCLE_OVERVIEW.path, 
      component: CycleOverview 
    },
    { 
      path: pages.ROADMAP.path, 
      component: ReleaseOverview 
    }
  ]

  return createRouter({
    history: createWebHistory(),
    routes
  })
}