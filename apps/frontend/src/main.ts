import { createApp } from 'vue'
import App from './App.vue'
import createAppRouter from './router/index.js'
import createAppStore from './store/index.js'
import { CycleDataService } from './services/index.js'
import { OmegaConfig } from '@omega/shared-config'
import { logger } from '@omega-one/shared-utils'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './assets/css/style.css'
import VueApexCharts from 'vue3-apexcharts'

// Create services
const omegaConfig = new OmegaConfig({
  overrides: { environment: (import.meta as any).env?.MODE || 'development' }
})
const cycleDataService = new CycleDataService(omegaConfig)

// Create the Vue app
const app = createApp(App)

// Add router, store, and Ant Design Vue
const router = createAppRouter(omegaConfig)
app.use(router)
const store = createAppStore(cycleDataService, omegaConfig, router) // Create store with dependencies including router
app.use(store)

app.use(Antd)
app.use(VueApexCharts as any)

// Mount the app
try {
  app.mount('#app')
  
  logger.default.info('Omega One frontend started successfully!')
} catch (error) {
  const errorMessage = (error as Error)?.message || error?.toString() || 'Unknown error'
  logger.error.errorSafe('Error mounting Vue app', error)
}
