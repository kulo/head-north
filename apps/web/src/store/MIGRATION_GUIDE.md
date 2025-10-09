# Vuex Store Refactoring Migration Guide

## Overview

The Vuex store has been refactored to focus purely on state management, with complex business logic extracted to dedicated services and composables. This improves separation of concerns, testability, and maintainability.

## What Was Extracted

### 1. Business Logic Functions

- `selectBestCycle` → `src/lib/selectors/cycle-selector.ts`
- `calculateCycleProgress` → `src/lib/cycle-progress-calculator.ts`

### 2. Data Processing Logic

- Complex data transformations → `src/lib/transformers/data-transformer.ts`
- Filter management → `src/services/cycle-data-view-coordinator.ts`

### 3. Complex Getters

- Data calculations → `src/composables/useCycleData.ts`
- Filter operations → `src/composables/useFilters.ts`

## New Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │    │   Composables    │    │    Services     │
│                 │◄───┤                  │◄───┤                 │
│ - Use composables│    │ - useCycleData   │    │ - DataService   │
│ - Clean logic   │    │ - useFilters     │    │ - Business logic│
└─────────────────┘    │ - useStoreData   │    └─────────────────┘
                       └──────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Simplified Store│
                       │                 │
                       │ - Pure state    │
                       │ - Simple actions│
                       │ - Basic getters │
                       └─────────────────┘
```

## Migration Steps

### 1. Update Store Import

Replace the old store with the simplified version:

```typescript
// Before
import store from "./store/index";

// After
import store from "./store/simplified-store";
```

### 2. Update Component Usage

#### Before (Complex Store Usage)

```vue
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <h2>{{ cycleOverviewData?.cycle.name }}</h2>
      <div>Progress: {{ cycleOverviewData?.cycle.progress }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();

// Complex getters with business logic
const cycleOverviewData = computed(
  () => store.getters.filteredCycleOverviewData,
);
const loading = computed(() => store.getters.loading);
const error = computed(() => store.getters.error);

// Complex actions
const updateFilter = (key: string, value: any) => {
  store.dispatch("updateFilter", { key, value });
};
</script>
```

#### After (Clean Composable Usage)

```vue
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <h2>{{ filteredCycleOverviewData?.cycle.name }}</h2>
      <div>Progress: {{ filteredCycleOverviewData?.cycle.progress }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStoreData } from "@/composables/useStoreData";

// Clean, focused interface
const { loading, error, filteredCycleOverviewData, updateFilter } =
  useStoreData();
</script>
```

### 3. Benefits of New Architecture

#### Separation of Concerns

- **Store**: Pure state management
- **Services**: Business logic and data processing
- **Composables**: Reactive data transformations
- **Components**: UI logic only

#### Improved Testability

```typescript
// Easy to test business logic in isolation
import { selectBestCycle } from "@/lib/cycle-selector";

describe("selectBestCycle", () => {
  it("should select active cycle when available", () => {
    const cycles = [
      { id: "1", state: "closed" },
      { id: "2", state: "active" },
    ];
    expect(selectBestCycle(cycles)?.id).toBe("2");
  });
});
```

#### Better Performance

- Computed properties are cached and only recalculate when dependencies change
- Business logic is not re-executed on every store access
- Cleaner dependency tracking

#### Enhanced Maintainability

- Business logic is centralized and reusable
- Store is simpler and easier to understand
- Clear boundaries between different concerns

## File Structure

```
src/
├── lib/
│   ├── cycle-selector.ts           # Pure cycle selection logic
│   └── cycle-progress-calculator.ts # Pure progress calculations
├── services/
│   └── data-service.ts             # Data processing and transformations
├── composables/
│   ├── useCycleData.ts             # Cycle data calculations
│   ├── useFilters.ts               # Filter management
│   └── useStoreData.ts             # Store integration
└── store/
    ├── simplified-store.ts         # Clean, focused store
    └── MIGRATION_GUIDE.md          # This guide
```

## Next Steps

1. **Update imports** in your main.ts or app initialization
2. **Migrate components** to use the new composables
3. **Update tests** to test business logic in isolation
4. **Remove old store file** once migration is complete
5. **Consider further optimizations** like lazy loading or caching

## Example Component Migration

See the example above for a complete before/after comparison of component usage.
