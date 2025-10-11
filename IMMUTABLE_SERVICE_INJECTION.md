# 🔒 Immutable Service Injection Patterns

## 🎯 **Problem with Current Approach**

```typescript
// ❌ Mutable shared state
let cycleDataService: CycleDataService | null = null;
let cycleDataViewCoordinator: CycleDataViewCoordinator | null = null;

function initializeServices(service, coordinator) {
  cycleDataService = service; // ❌ Mutating shared state
  cycleDataViewCoordinator = coordinator;
}
```

## 💡 **Solution 1: Factory Functions (Recommended)**

### **Create Stores with Immutable Services**

```typescript
// src/stores/data.ts
export function createDataStore(
  cycleDataService: CycleDataService,
  cycleDataViewCoordinator: CycleDataViewCoordinator,
) {
  return defineStore("data", () => {
    // ✅ Services are immutable constants
    const dataService = cycleDataService;
    const coordinator = cycleDataViewCoordinator;

    // State
    const rawData = ref<CycleData | null>(null);
    const processedData = ref<NestedCycleData | null>(null);

    // Computed properties
    const filteredRoadmapData = computed(() => {
      return coordinator.generateFilteredRoadmapData(
        rawData.value,
        processedData.value,
      );
    });

    // Actions
    async function fetchAndProcessData() {
      const cycleData = await dataService.getCycleData();
      setRawData(cycleData);

      const processed = DataTransformer.processCycleData(cycleData, {});
      setProcessedData(processed);
    }

    return {
      rawData,
      processedData,
      filteredRoadmapData,
      fetchAndProcessData,
    };
  });
}
```

### **Usage in main.ts**

```typescript
// src/main.ts
import { createDataStore } from './stores/data'
import { createFilterStore } from './stores/filters'
import { createAppStore } from './stores/app'

// Create services (immutable)
const omegaConfig = new OmegaConfig({...})
const cycleDataService = new CycleDataService(omegaConfig)
const viewFilterManager = createViewFilterManager(omegaConfig)
const cycleDataViewCoordinator = createCycleDataViewCoordinator(viewFilterManager)

// Create stores with services (immutable)
const dataStore = createDataStore(cycleDataService, cycleDataViewCoordinator)
const filterStore = createFilterStore(viewFilterManager, router)
const appStore = createAppStore(router, omegaConfig)

// Register stores with Pinia
const pinia = createPinia()
pinia.use(({ store }) => {
  if (store.$id === 'data') {
    // Register the data store
  }
})

app.use(pinia)
app.mount('#app')

// Fetch initial data
await dataStore.fetchAndProcessData()
```

## 💡 **Solution 2: Vue 3 Provide/Inject with Immutable Services**

### **Provide Services at App Level**

```typescript
// src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";

// Create services (immutable)
const services = {
  cycleDataService: new CycleDataService(omegaConfig),
  viewFilterManager: createViewFilterManager(omegaConfig),
  cycleDataViewCoordinator: createCycleDataViewCoordinator(viewFilterManager),
  router,
  config: omegaConfig,
} as const; // ✅ Immutable

const app = createApp(App);

// Provide services (immutable)
app.provide("services", services);

const pinia = createPinia();
app.use(pinia);
app.mount("#app");
```

### **Inject Services in Stores**

```typescript
// src/stores/data.ts
import { inject } from "vue";

export const useDataStore = defineStore("data", () => {
  // ✅ Services injected as immutable constants
  const services = inject<typeof services>("services")!;
  const { cycleDataService, cycleDataViewCoordinator } = services;

  // State
  const rawData = ref<CycleData | null>(null);
  const processedData = ref<NestedCycleData | null>(null);

  // Computed properties
  const filteredRoadmapData = computed(() => {
    return cycleDataViewCoordinator.generateFilteredRoadmapData(
      rawData.value,
      processedData.value,
    );
  });

  // Actions
  async function fetchAndProcessData() {
    const cycleData = await cycleDataService.getCycleData();
    setRawData(cycleData);

    const processed = DataTransformer.processCycleData(cycleData, {});
    setProcessedData(processed);
  }

  return {
    rawData,
    processedData,
    filteredRoadmapData,
    fetchAndProcessData,
  };
});
```

## 💡 **Solution 3: Dependency Injection Container**

### **Create a Simple DI Container**

```typescript
// src/services/container.ts
export class DIContainer {
  private services = new Map<string, any>();

  register<T>(key: string, service: T): T {
    if (this.services.has(key)) {
      throw new Error(`Service ${key} already registered`);
    }
    this.services.set(key, service);
    return service;
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found`);
    }
    return service;
  }
}

// Global container (immutable after registration)
export const container = new DIContainer();
```

### **Register Services**

```typescript
// src/main.ts
import { container } from "./services/container";

// Register services (immutable after registration)
container.register("cycleDataService", new CycleDataService(omegaConfig));
container.register("viewFilterManager", createViewFilterManager(omegaConfig));
container.register(
  "cycleDataViewCoordinator",
  createCycleDataViewCoordinator(viewFilterManager),
);
container.register("router", router);
container.register("config", omegaConfig);
```

### **Use in Stores**

```typescript
// src/stores/data.ts
import { container } from "../services/container";

export const useDataStore = defineStore("data", () => {
  // ✅ Services retrieved as immutable constants
  const cycleDataService = container.get<CycleDataService>("cycleDataService");
  const cycleDataViewCoordinator = container.get<CycleDataViewCoordinator>(
    "cycleDataViewCoordinator",
  );

  // ... rest of store implementation
});
```

## 🏆 **Recommended Approach: Factory Functions**

I recommend **Solution 1 (Factory Functions)** because:

### **✅ Benefits:**

- **Truly immutable** - Services are constants, never mutated
- **Type safe** - Full TypeScript support
- **Testable** - Easy to create stores with mock services
- **Clear dependencies** - Services are explicit parameters
- **No global state** - Each store instance has its own services
- **Follows functional programming** - Pure functions with immutable data

### **✅ Example Implementation:**

```typescript
// src/stores/index.ts
export function createStores(services: {
  cycleDataService: CycleDataService;
  viewFilterManager: ViewFilterManager;
  cycleDataViewCoordinator: CycleDataViewCoordinator;
  router: Router;
  config: OmegaConfig;
}) {
  return {
    data: createDataStore(
      services.cycleDataService,
      services.cycleDataViewCoordinator,
    ),
    filters: createFilterStore(services.viewFilterManager, services.router),
    app: createAppStore(services.router, services.config),
    validation: createValidationStore(services.config),
  };
}

// src/main.ts
const services = {
  cycleDataService: new CycleDataService(omegaConfig),
  viewFilterManager: createViewFilterManager(omegaConfig),
  cycleDataViewCoordinator: createCycleDataViewCoordinator(viewFilterManager),
  router,
  config: omegaConfig,
} as const;

const stores = createStores(services);
// All stores now have immutable service dependencies
```

## 🎯 **Result**

Instead of:

```typescript
// ❌ Mutable shared state
let service = null;
function init(s) {
  service = s;
}
```

We get:

```typescript
// ✅ Immutable constants
function createStore(service) {
  return defineStore(() => {
    const dataService = service; // ✅ Immutable constant
    // ...
  });
}
```

This approach eliminates mutable shared state while maintaining clean, testable, and maintainable code.
