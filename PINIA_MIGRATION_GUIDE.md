# Pinia Migration Guide

This guide provides a detailed plan for migrating from Vuex to Pinia in the Omega Web application.

## Overview

The migration breaks down the monolithic 437-line Vuex store into 4 focused Pinia stores:

1. **`useAppStore`** - Core app state (loading, error, pages, currentPage)
2. **`useDataStore`** - Data management (rawData, processedData)
3. **`useFilterStore`** - Filter management (filters, filter operations)
4. **`useValidationStore`** - Validation state (validationEnabled, validationSummary)

## Migration Phases

### Phase 1: Setup and Preparation (Week 1)

#### 1.1 Install Dependencies

```bash
npm install pinia
```

#### 1.2 Create Store Structure

- Create `/src/stores/` directory
- Implement the 4 Pinia stores
- Create store factory and composables

#### 1.3 Update Package.json

Remove Vuex dependency after migration is complete:

```bash
npm uninstall vuex
```

### Phase 2: Parallel Implementation (Week 2)

#### 2.1 Create Pinia Stores

- ✅ `stores/app.ts` - Core application state
- ✅ `stores/data.ts` - Data management
- ✅ `stores/filters.ts` - Filter management
- ✅ `stores/validation.ts` - Validation state
- ✅ `stores/index.ts` - Store factory and exports
- ✅ `composables/usePiniaStores.ts` - Unified composable

#### 2.2 Create Migration Bridge

- Create `main-pinia.ts` as target main.ts
- Keep existing Vuex implementation running
- Test Pinia stores in isolation

### Phase 3: Component Migration (Week 3)

#### 3.1 Update Components One by One

**Priority Order:**

1. Simple components first (ValidationSelector, PageSelector)
2. Complex components last (CycleOverview, Roadmap)

**Migration Pattern:**

```typescript
// Before (Vuex)
import { useStore } from "vuex";
const store = useStore();
const loading = computed(() => store.state.loading);

// After (Pinia)
import { usePiniaStores } from "../composables/usePiniaStores";
const { loading } = usePiniaStores(cycleDataViewCoordinator);
```

#### 3.2 Component Migration Checklist

**Components to migrate:**

- [ ] `ValidationSelector.vue`
- [ ] `PageSelector.vue`
- [ ] `AreaSelector.vue`
- [ ] `CycleSelector.vue`
- [ ] `InitiativeSelector.vue`
- [ ] `StageSelector.vue`
- [ ] `AssigneeSelector.vue`
- [ ] `RoadmapItemListItem.vue`
- [ ] `CycleOverview.vue`
- [ ] `Roadmap.vue`

### Phase 4: Service Integration (Week 4)

#### 4.1 Update Services

- Update `CycleDataViewCoordinator` to work with Pinia
- Ensure `ViewFilterManager` integration works
- Update any service dependencies

#### 4.2 Update Main Application

- Replace `main.ts` with `main-pinia.ts`
- Update router integration
- Test full application flow

### Phase 5: Testing and Cleanup (Week 5)

#### 5.1 Testing Strategy

- Unit tests for each store
- Integration tests for store interactions
- E2E tests for critical user flows
- Performance testing

#### 5.2 Cleanup

- Remove Vuex store files
- Remove Vuex dependencies
- Update documentation
- Remove migration bridge code

## Key Benefits of Migration

### 1. Simplified API

```typescript
// Vuex (verbose)
commit("SET_LOADING", true);
dispatch("fetchAndProcessData");

// Pinia (direct)
appStore.setLoading(true);
await dataStore.fetchAndProcessData(service, appStore);
```

### 2. Better TypeScript Support

```typescript
// Pinia provides full type inference
const { loading, error } = useAppStore(); // Fully typed
```

### 3. Modular Architecture

```typescript
// Import only what you need
import { useAppStore } from "@/stores/app";
import { useDataStore } from "@/stores/data";
```

### 4. Composition API Integration

```typescript
// Pinia stores are composables
export const useAppStore = defineStore("app", () => {
  const loading = ref(false); // Direct reactive state
  const setLoading = (value: boolean) => {
    loading.value = value;
  };
  return { loading, setLoading };
});
```

## Migration Risks and Mitigation

### Risk 1: Breaking Changes

**Mitigation:** Parallel implementation, gradual migration, comprehensive testing

### Risk 2: Service Dependencies

**Mitigation:** Dependency injection pattern maintained, services updated incrementally

### Risk 3: Component Complexity

**Mitigation:** Start with simple components, use migration bridge composable

### Risk 4: Performance Impact

**Mitigation:** Performance testing, store optimization, lazy loading where appropriate

## Testing Strategy

### Unit Tests

```typescript
// Test individual stores
import { setActivePinia, createPinia } from "pinia";
import { useAppStore } from "@/stores/app";

describe("App Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should set loading state", () => {
    const store = useAppStore();
    store.setLoading(true);
    expect(store.isLoading).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test store interactions
describe("Store Integration", () => {
  it("should fetch data and update loading state", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    await dataStore.fetchAndProcessData(mockService, appStore);

    expect(appStore.isLoading).toBe(false);
    expect(dataStore.hasRawData).toBe(true);
  });
});
```

## Rollback Plan

If issues arise during migration:

1. **Keep Vuex implementation** until migration is 100% complete
2. **Feature flags** to switch between Vuex and Pinia
3. **Gradual rollout** - migrate components one by one
4. **Comprehensive testing** at each phase
5. **Documentation** of all changes for easy rollback

## Success Metrics

- [ ] All components migrated successfully
- [ ] No performance regression
- [ ] All tests passing
- [ ] TypeScript errors resolved
- [ ] Bundle size reduced (Pinia is smaller than Vuex)
- [ ] Developer experience improved (better TypeScript support)

## Timeline

- **Week 1:** Setup and preparation
- **Week 2:** Create Pinia stores
- **Week 3:** Migrate components
- **Week 4:** Service integration
- **Week 5:** Testing and cleanup

**Total estimated time:** 5 weeks with 1 developer

## Next Steps

1. Review and approve this migration plan
2. Install Pinia dependency
3. Create the store structure
4. Begin with Phase 1 implementation
5. Set up testing infrastructure
6. Start component migration

This migration will modernize the state management, improve TypeScript support, and align with current Vue 3 best practices.
