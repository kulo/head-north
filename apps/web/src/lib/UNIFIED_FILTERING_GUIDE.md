# Unified Filtering System - Integration Guide

This guide explains how to integrate the new unified filtering system into the omega-one application.

## Overview

The unified filtering system replaces the fragmented filtering approach with a single, composable system that:

1. **Processes data once** - Raw CycleData is transformed to NestedCycleData and filtered in one operation
2. **Applies filters consistently** - Same filtering logic for both roadmap and cycle overview views
3. **Manages state centrally** - Single filter state object instead of scattered properties
4. **Cascades results** - Filters applied at ReleaseItem level cascade up through the hierarchy

## Architecture

```
RawCycleData → DataProcessor → NestedCycleData → UnifiedFilter → FilteredNestedCycleData
                    ↓
            Store (UnifiedStoreState)
                    ↓
            UI Components (UnifiedSelectors + UnifiedViews)
```

## Integration Steps

### 1. Update Store Import

Replace the old store with the unified store:

```typescript
// Before
import createAppStore from "@/store/index";

// After
import createUnifiedStore from "@/store/unified-store";

// In main.ts or app setup
const store = createUnifiedStore(cycleDataService, omegaConfig, router);
```

### 2. Update Component Imports

Replace old selector components with unified versions:

```vue
<!-- Before -->
<template>
  <initiative-selector></initiative-selector>
  <area-selector></area-selector>
  <stage-selector></stage-selector>
  <assignee-selector></assignee-selector>
  <cycle-selector></cycle-selector>
</template>

<!-- After -->
<template>
  <unified-initiative-selector></unified-initiative-selector>
  <unified-area-selector></unified-area-selector>
  <unified-stage-selector></unified-stage-selector>
  <unified-assignee-selector></unified-assignee-selector>
  <unified-cycle-selector></unified-cycle-selector>
</template>
```

### 3. Update Main Components

Replace old components with unified versions:

```vue
<!-- Before -->
<template>
  <roadmap></roadmap>
  <cycle-overview></cycle-overview>
</template>

<!-- After -->
<template>
  <unified-roadmap></unified-roadmap>
  <unified-cycle-overview></unified-cycle-overview>
</template>
```

### 4. Update Store Actions

Replace old store actions with unified equivalents:

```typescript
// Before
await store.dispatch("fetchRoadmap");
await store.dispatch("fetchCycleOverviewData");
store.dispatch("setSelectedInitiatives", initiatives);
store.dispatch("setSelectedArea", area);

// After
await store.dispatch("fetchAndProcessData");
store.dispatch("updateFilter", { key: "initiatives", value: initiatives });
store.dispatch("updateFilter", { key: "area", value: area });
```

## API Reference

### Store Actions

#### `fetchAndProcessData()`

Fetches raw data and processes it with current filters.

```typescript
await store.dispatch("fetchAndProcessData");
```

#### `updateFilters(filters: FilterCriteria)`

Updates all filters and reprocesses data.

```typescript
const newFilters = {
  area: "frontend",
  initiatives: ["init-1", "init-2"],
  stages: ["in-progress"],
  assignees: ["john.doe"],
  cycle: "2024-Q1",
};
await store.dispatch("updateFilters", newFilters);
```

#### `updateFilter({ key, value })`

Updates a single filter and reprocesses data.

```typescript
store.dispatch("updateFilter", { key: "area", value: "backend" });
store.dispatch("updateFilter", { key: "initiatives", value: ["init-1"] });
```

### Store Getters

#### `roadmapData`

Returns processed roadmap data with filters applied.

```typescript
const roadmapData = computed(() => store.getters.roadmapData);
```

#### `cycleOverviewData`

Returns processed cycle overview data with filters applied.

```typescript
const cycleOverviewData = computed(() => store.getters.cycleOverviewData);
```

#### `currentFilters`

Returns current filter state.

```typescript
const filters = computed(() => store.getters.currentFilters);
```

### Filter Criteria

```typescript
interface FilterCriteria {
  area?: string; // "all" or specific area ID
  initiatives?: string[]; // Array of initiative IDs
  stages?: string[]; // Array of stage IDs
  assignees?: string[]; // Array of assignee IDs
  cycle?: string; // Cycle ID
}
```

## Data Flow

### 1. Data Loading

```
User Action → fetchAndProcessData() → CycleDataService.getCycleData() → DataProcessor.processCycleData() → Store
```

### 2. Filter Application

```
User Filter Change → updateFilter() → DataProcessor.processCycleData() → Store → UI Update
```

### 3. Data Access

```
UI Component → Store Getter → Processed Data → Render
```

## Benefits

1. **Performance**: Data processed and filtered once, not multiple times
2. **Consistency**: Same filtering logic for all views
3. **Maintainability**: Single source of truth for filtering logic
4. **Readability**: Clear separation of concerns
5. **Testability**: Isolated filter logic is easier to test

## Migration Checklist

- [ ] Update store import to use `createUnifiedStore`
- [ ] Replace selector components with unified versions
- [ ] Replace main components with unified versions
- [ ] Update store action calls to use unified actions
- [ ] Remove old filter functions from `/filters` directory
- [ ] Remove old store getters and mutations
- [ ] Update tests to use unified system
- [ ] Remove old component files

## Troubleshooting

### Common Issues

1. **Filter not applying**: Check that you're using `updateFilter` action
2. **Data not loading**: Ensure `fetchAndProcessData` is called
3. **Component not updating**: Verify store getters are being used correctly

### Debug Tips

1. Check store state: `console.log(store.state)`
2. Check current filters: `console.log(store.getters.currentFilters)`
3. Check processed data: `console.log(store.getters.roadmapData)`

## Performance Considerations

- Data is processed once when filters change
- No redundant filtering operations
- Efficient cascading filter application
- Minimal re-renders due to computed properties
