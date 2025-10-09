# Clean Service Architecture

## Overview

After refactoring, we now have a clear, well-defined service architecture with distinct responsibilities and no overlap.

## Service Layer Responsibilities

### 1. **CycleDataService** (API Layer)

**Location**: `src/services/cycle-data-service.ts`

**Purpose**: Handles all external API communication and data fetching

**Responsibilities**:

- HTTP requests to backend API
- Caching and cache management
- Error handling and retry logic
- Data validation from API responses
- Environment configuration (timeouts, retries, etc.)

**Input**: API endpoints, configuration
**Output**: Raw `CycleData` from backend

**Example**:

```typescript
const cycleData = await cycleDataService.getCycleData();
// Returns: { cycles: [...], roadmapItems: [...], releaseItems: [...] }
```

---

### 2. **CycleDataViewCoordinator** (Business Operations Layer)

**Location**: `src/services/cycle-data-view-coordinator.ts`

**Purpose**: Coordinates cycle data processing and view management operations

**Responsibilities**:

- Coordinate data processing between raw data and UI-ready formats
- Manage filter operations with side effects
- Generate view-specific data (roadmap, cycle overview)
- Integrate with filter management system
- Handle stateful operations and business logic

**Input**: Raw `CycleData` from CycleDataService
**Output**: Processed data structures and filter management

**Example**:

```typescript
// Process raw data
const processedData = cycleDataViewCoordinator.processCycleData(rawData);

// Generate view-specific data
const roadmapData = cycleDataViewCoordinator.generateRoadmapData(
  rawData,
  processedData,
);
const cycleOverview =
  cycleDataViewCoordinator.generateFilteredCycleOverviewData(
    rawData,
    processedData,
  );

// Manage filters (has side effects)
const updatedFilters = cycleDataViewCoordinator.updateFilter(
  "area",
  "frontend",
);
```

### 3. **DataTransformer** (Pure Data Transformation Layer)

**Location**: `src/lib/data-transformer.ts`

**Purpose**: Pure data transformation functions with no side effects

**Responsibilities**:

- Transform raw `CycleData` → `NestedCycleData` structure
- Calculate progress metrics and statistics
- Apply filtering and data manipulation
- Generate view-specific data structures
- Pure functions with no external dependencies

**Input**: Raw `CycleData` and filter criteria
**Output**: Processed `NestedCycleData` and view-specific data structures

**Example**:

```typescript
// Pure data transformation
const processedData = DataTransformer.processCycleData(rawData, filters);
const roadmapData = DataTransformer.generateRoadmapData(rawData, processedData);
```

---

### 4. **Vuex Store** (State Management Layer)

**Location**: `src/store/simplified-store.ts`

**Purpose**: Pure state management with minimal business logic

**Responsibilities**:

- Store raw and processed data
- Manage UI state (loading, errors, current page)
- Handle filter state
- Simple mutations and actions
- Coordinate between services

**Input**: Data from services
**Output**: Reactive state for components

---

### 5. **Composables** (Reactive Logic Layer)

**Location**: `src/composables/`

**Purpose**: Provide reactive, computed data for components

**Responsibilities**:

- Reactive computed properties
- Data transformation for UI
- Filter management
- Bridge between store and components

**Input**: Store state
**Output**: Reactive computed data for components

---

## Architecture Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Backend API   │    │ CycleDataService │    │   Vuex Store    │
│                 │◄───┤                  │◄───┤                 │
│ - Raw data      │    │ - HTTP requests  │    │ - State mgmt    │
│ - Endpoints     │    │ - Caching        │    │ - Simple actions│
└─────────────────┘    │ - Error handling │    └─────────────────┘
                       └──────────────────┘              │
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │CycleDataViewCoord│    │  Composables    │
                       │                  │    │                 │
                       │ - Business ops   │    │ - Reactive data │
                       │ - Side effects   │    │ - Computed props│
                       │ - Coordination   │    │ - Filter mgmt   │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        │
                       ┌──────────────────┐              │
                       │ DataTransformer  │              │
                       │                  │              │
                       │ - Pure functions │              │
                       │ - No side effects│              │
                       │ - Data transform │              │
                       └──────────────────┘              │
                                │                        │
                                └────────┬───────────────┘
                                         ▼
                                ┌─────────────────┐
                                │   Components    │
                                │                 │
                                │ - UI logic only │
                                │ - Clean data    │
                                └─────────────────┘
```

## Key Benefits

### 1. **Clear Separation of Concerns**

- **API Layer**: Only handles external communication
- **Business Operations Layer**: Coordinates data processing and manages side effects
- **Pure Data Layer**: Only handles pure data transformations
- **State Layer**: Only handles state management
- **UI Layer**: Only handles reactive data and UI logic

### 2. **No Overlap or Confusion**

- Each service has a single, well-defined responsibility
- No duplicate functionality
- Clear data flow from API → Business Operations → Pure Transformations → State → UI

### 3. **Easy Testing**

- Each layer can be tested in isolation
- Pure functions in DataTransformer are easy to test
- Business operations can be mocked for integration tests
- Clear separation between pure logic and side effects

### 4. **Maintainable**

- Changes to API don't affect data processing
- Changes to business operations don't affect pure transformations
- Changes to data processing don't affect state management
- Clear boundaries make debugging easier

## Usage Examples

### In Components

```vue
<script setup lang="ts">
import { useStoreData } from "@/composables/useStoreData";

// Clean, focused interface
const { loading, error, filteredCycleOverviewData, updateFilter, switchView } =
  useStoreData();
</script>
```

### In Store Actions

```typescript
// Simple, focused action
async fetchAndProcessData({ commit }) {
  const rawData = await cycleDataService.getCycleData();
  const processedData = cycleDataViewCoordinator.processCycleData(rawData);
  commit("SET_RAW_DATA", rawData);
  commit("SET_PROCESSED_DATA", processedData);
}
```

### Direct Service Usage

```typescript
// For complex operations
const roadmapData = cycleDataViewCoordinator.generateFilteredRoadmapData(
  rawData,
  processedData,
);
const updatedFilters = cycleDataViewCoordinator.updateFilter(
  "area",
  "frontend",
);
```

## Migration Benefits

1. **Removed Redundancy**: Eliminated the confusing generic `DataService` wrapper
2. **Clear Naming**: `CycleDataViewCoordinator` clearly indicates its purpose
3. **Split Responsibilities**: Pure transformations in `/lib`, business operations in `/services`
4. **Cleaner Store**: Focused purely on state management
5. **Better Composables**: Provide clean, reactive interfaces
6. **Clear Architecture**: Each layer has a single, well-defined purpose

This architecture follows the **Single Responsibility Principle** and provides a clean, maintainable foundation for your application.
