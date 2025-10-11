# 🏗️ Simpler Architecture Proposal

## 🎯 **Current Problems**

1. **Singleton Anti-Pattern**: Global `ServiceIntegrationManager` instance
2. **Unnecessary Complexity**: Extra layer of abstraction
3. **Hard to Test**: Global state makes testing difficult
4. **Tight Coupling**: Everything depends on the integration manager

## 💡 **Proposed Solution: Direct Service Injection**

### **1. Remove ServiceIntegrationManager**

Instead of a complex integration manager, inject services directly into stores.

### **2. Simplified Data Store**

```typescript
// src/stores/data.ts
export const useDataStore = defineStore("data", () => {
  // State
  const rawData = ref<CycleData | null>(null);
  const processedData = ref<NestedCycleData | null>(null);

  // Services (injected directly)
  let cycleDataService: CycleDataService | null = null;
  let cycleDataViewCoordinator: CycleDataViewCoordinator | null = null;

  // Initialize services
  function initializeServices(
    dataService: CycleDataService,
    coordinator: CycleDataViewCoordinator,
  ) {
    cycleDataService = dataService;
    cycleDataViewCoordinator = coordinator;
  }

  // Computed properties
  const filteredRoadmapData = computed(() => {
    if (!cycleDataViewCoordinator) return roadmapData.value;
    return cycleDataViewCoordinator.generateFilteredRoadmapData(
      rawData.value,
      processedData.value,
    );
  });

  // Actions
  async function fetchAndProcessData() {
    if (!cycleDataService) throw new Error("CycleDataService not initialized");

    const cycleData = await cycleDataService.getCycleData();
    setRawData(cycleData);

    const processed = DataTransformer.processCycleData(cycleData, {});
    setProcessedData(processed);
  }

  return {
    // State
    rawData,
    processedData,

    // Getters
    filteredRoadmapData,

    // Actions
    initializeServices,
    fetchAndProcessData,
  };
});
```

### **3. Simplified Main.ts**

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// Create services
const omegaConfig = new OmegaConfig({...})
const cycleDataService = new CycleDataService(omegaConfig)
const viewFilterManager = createViewFilterManager(omegaConfig)
const cycleDataViewCoordinator = createCycleDataViewCoordinator(viewFilterManager)

// Create app
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Initialize stores with services
const dataStore = useDataStore()
const filterStore = useFilterStore()
const appStore = useAppStore()

dataStore.initializeServices(cycleDataService, cycleDataViewCoordinator)
filterStore.initializeServices(viewFilterManager, router)
appStore.initializeServices(router, omegaConfig)

// Mount app
app.mount('#app')

// Fetch initial data
await dataStore.fetchAndProcessData()
```

### **4. Benefits of This Approach**

#### **✅ Simpler**

- No complex integration manager
- Direct service injection
- Clear dependencies

#### **✅ More Testable**

- Each store can be tested independently
- No global state
- Easy to mock services

#### **✅ Better Performance**

- No extra abstraction layer
- Direct service access
- Smaller bundle size

#### **✅ More Maintainable**

- Clear service dependencies
- Easier to understand
- Less code to maintain

## 🔄 **Migration Steps**

1. **Remove ServiceIntegrationManager**
2. **Add service injection to each store**
3. **Update main.ts to initialize stores directly**
4. **Update components to use stores directly**
5. **Remove global service integration functions**

## 🎯 **Result**

Instead of:

```typescript
// Complex
const integration = getServiceIntegration();
await integration.fetchAndProcessData();
```

We get:

```typescript
// Simple
const dataStore = useDataStore();
await dataStore.fetchAndProcessData();
```

## 🤔 **Why This Is Better**

1. **Follows Pinia patterns** - Each store manages its own dependencies
2. **Eliminates singleton** - No global state
3. **Easier testing** - Each store can be tested independently
4. **Better performance** - No extra abstraction layer
5. **Clearer code** - Direct dependencies, no hidden complexity

## 🚀 **Next Steps**

Would you like me to implement this simpler architecture? It would involve:

1. Refactoring the stores to accept services directly
2. Updating main.ts to initialize stores without the integration manager
3. Removing the ServiceIntegrationManager entirely
4. Updating tests to work with the new architecture

This would result in a much cleaner, more maintainable codebase that follows Vue 3 and Pinia best practices.
