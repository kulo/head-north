# Unified Data System Migration Guide

This guide outlines the migration from separate roadmap and cycle overview data structures to a unified system.

## Overview

The unified data system eliminates the need for different filtering approaches by providing a single, consistent data structure that works for both roadmap and cycle overview views.

## Benefits

- ✅ **Single filtering logic** - One `applyFilters()` function for everything
- ✅ **Type safety** - Runtime validation catches issues during refactoring
- ✅ **Better performance** - No duplicate filtering logic
- ✅ **Easier maintenance** - One data structure to maintain
- ✅ **Consistent APIs** - Same interface for both views

## Data Structure Changes

### Before (Separate Structures)

```javascript
// Roadmap Data
roadmapData: {
  orderedSprints: [...],
  activeSprint: {...},
  roadmapItems: [
    {
      initiativeId: "init1",
      roadmapItems: [...]
    }
  ]
}

// Cycle Overview Data
cycleOverviewData: {
  cycle: {...},
  initiatives: [
    {
      initiativeId: "init1",
      initiative: "Frontend Initiative",
      roadmapItems: [...]
    }
  ]
}
```

### After (Unified Structure)

```javascript
// Unified Data (works for both views)
unifiedData: {
  metadata: {
    type: 'roadmap' | 'cycle-overview',
    cycle: {...} | null,
    sprints: [...],
    activeSprint: {...} | null
  },
  initiatives: [
    {
      initiativeId: "init1",
      initiative: "Frontend Initiative",
      roadmapItems: [...]
    }
  ]
}
```

## Migration Steps

### Phase 1: Add Unified System (✅ COMPLETED)

- [x] Create `unifiedDataSystem.js` with transformation utilities
- [x] Add comprehensive tests
- [x] Add runtime validation
- [x] Update store to use unified filtering

### Phase 2: Update Store Internally (🔄 IN PROGRESS)

- [ ] Store uses unified structure internally
- [ ] Transform to old formats for components
- [ ] No component changes needed yet

### Phase 3: Update Components (⏳ PENDING)

- [ ] Components work directly with unified structure
- [ ] Remove transformation layer
- [ ] Cleaner, simpler code

### Phase 4: Remove Old Structures (⏳ PENDING)

- [ ] Delete old data structures
- [ ] Remove transformation utilities
- [ ] Single source of truth

## Usage Examples

### Basic Filtering

```javascript
// Works with any data type
const filtered = applyFilters(data, {
  area: 'frontend',
  initiatives: [{ id: 'init1' }],
  stages: [{ id: 's0' }]
})
```

### Data Transformation

```javascript
// Convert to unified format
const unified = transformRoadmapToUnified(roadmapData)
const unified = transformCycleOverviewToUnified(cycleOverviewData)

// Convert back to original format
const roadmap = transformUnifiedToRoadmap(unified)
const cycleOverview = transformUnifiedToCycleOverview(unified)
```

### Store Integration

```javascript
// Store getter - works for both views
filteredData: (state) => {
  return applyFilters(state.unifiedData, {
    area: state.selectedArea,
    initiatives: state.selectedInitiatives,
    stages: state.selectedStages
  })
}
```

## Testing

Run the tests to ensure everything works correctly:

```bash
npm test -- --testPathPattern=unifiedDataSystem
```

## Rollback Plan

If issues arise, you can rollback by:

1. Reverting the store import to use `unifiedFiltering.js`
2. The old filtering system will continue to work
3. No data structure changes are required for rollback

## Safety Measures

- **Runtime Validation**: All data is validated at runtime
- **Comprehensive Tests**: Full test coverage for all functions
- **Error Handling**: Graceful error handling with detailed logging
- **Incremental Migration**: Can be rolled out gradually
- **Backward Compatibility**: Old systems continue to work during migration
