# Data Flow Documentation

This document describes how data flows through the Head North system, from JIRA adapters to Vue frontend components, including all data format transformations.

## Overview

Data flows through 8 distinct layers, with transformations at each stage:

```
JIRA API → Adapter → API Service → API Controller → Frontend Service → Data Transformer → Store → Vue Components
```

### Data Flow Diagram

```mermaid
graph TB
    subgraph "Backend"
        JIRA[JIRA API<br/>JiraIssue[], JiraSprint[]]
        ADAPTER[Adapter Layer<br/>DefaultJiraAdapter / PrewaveJiraAdapter / FakeDataAdapter]
        SERVICE[API Service<br/>collect-cycle-data.ts]
        CONTROLLER[API Controller<br/>get-cycle-data.ts]
    end

    subgraph "Frontend"
        FRONTEND_SERVICE[Frontend Service<br/>cycle-data-service.ts<br/>Caching]
        TRANSFORMER[Data Transformer<br/>data-transformer.ts<br/>Progress Calculation]
        STORE[Pinia Store<br/>data-store.ts]
        COMPONENTS[Vue Components<br/>Roadmap.vue / CycleOverview.vue]
    end

    JIRA -->|JiraIssue[], JiraSprint[]| ADAPTER
    ADAPTER -->|CycleData<br/>Area[]| SERVICE
    SERVICE -->|CycleData<br/>Validated| CONTROLLER
    CONTROLLER -->|HTTP JSON<br/>CycleData| FRONTEND_SERVICE
    FRONTEND_SERVICE -->|CycleData<br/>Cached| TRANSFORMER
    TRANSFORMER -->|NestedCycleData<br/>With Progress| STORE
    STORE -->|NestedCycleData| COMPONENTS

    style JIRA fill:#e1f5ff
    style ADAPTER fill:#b3e5fc
    style SERVICE fill:#81d4fa
    style CONTROLLER fill:#4fc3f7
    style FRONTEND_SERVICE fill:#fff3e0
    style TRANSFORMER fill:#ffe0b2
    style STORE fill:#ffcc80
    style COMPONENTS fill:#ffb74d
```

### Data Format Evolution

```mermaid
graph LR
    A[JIRA Raw Data<br/>JiraIssue, JiraSprint] -->|Transform| B[CycleData<br/>Area[], Objective[], etc.]
    B -->|Group & Calculate Progress| C[NestedCycleData<br/>objectives → roadmapItems → cycleItems]
    C -->|Display| D[Vue Components]

    style A fill:#e1f5ff
    style B fill:#b3e5fc
    style C fill:#81d4fa
    style D fill:#4fc3f7
```

## Data Flow Layers

### 1. Data Source Layer (JIRA API)

**Location:** `packages/jira-primitives/src/client.ts`

- **Input:** JIRA REST API responses
- **Output:** `JiraIssue[]`, `JiraSprint[]`
- **Format:** Raw JIRA domain objects with fields like `summary`, `status`, `assignee`, `labels`, `sprint`, etc.

### 2. Adapter Layer (JIRA → Domain)

**Location:** `apps/api/src/adapters/`

- **Input:** `JiraIssue[]`, `JiraSprint[]` from JiraClient
- **Output:** `CycleData`
- **Key Transformations:**
  - `JiraSprint` → `Cycle` (via `jiraSprintToCycle`)
  - `JiraIssue` → `RoadmapItem` (via `transformRoadmapItem`)
  - `JiraIssue` → `CycleItem` (via `transformCycleItem`)
  - Extract metadata: `Area[]`, `Objective[]`, `Team[]`, `Person[]`
  - **Areas Format:** `Area[]` (flat array, teams associated within each area)
  - **Teams Association:** Teams are associated with areas; orphaned teams go to `DEFAULT_AREA_UNASSIGNED`

**Available Adapters:**

- `DefaultJiraAdapter`: Standard JIRA setup
- `PrewaveJiraAdapter`: Prewave-specific (creates virtual roadmap items)
- `FakeDataAdapter`: Generates fake data for development

### 3. API Service Layer

**Location:** `apps/api/src/services/collect-cycle-data.ts`

- **Input:** `CycleData` from adapter
- **Output:** `CycleData` (validated)
- **Transformations:**
  - Validates data structure
  - **Note:** Progress calculations are handled in the frontend, not the backend

### 4. API Controller Layer

**Location:** `apps/api/src/controllers/actions/get-cycle-data.ts`

- **Input:** `CycleData` from service
- **Output:** HTTP response with `CycleData`
- **Format:** JSON serialization of `CycleData`

### 5. Frontend Service Layer

**Location:** `apps/web/src/services/cycle-data-service.ts`

- **Input:** `CycleData` from API
- **Output:** `CycleData` (cached)
- **Key Features:**
  - Caching with TTL
  - No transformation needed (areas already in array format)
  - Direct pass-through of `CycleData`

### 6. Data Processing Layer

**Location:** `apps/web/src/lib/transformers/data-transformer.ts`

- **Input:** `CycleData`
- **Output:** `NestedCycleData`
- **Key Transformations:**
  - Groups `roadmapItems` by `objectiveId` into hierarchical structure
  - Calculates progress metrics at roadmap item, objective, and cycle levels
  - Creates `ObjectiveWithProgress` with nested `RoadmapItemWithProgress`
  - Each roadmap item contains nested `cycleItems`
  - Creates `CycleWithProgress` combining `Cycle`, `ProgressMetrics`, and `CycleMetadata`

### 7. Store Layer

**Location:** `apps/web/src/stores/data-store.ts`

- **Stores:** Both `CycleData` (raw/flat) and `NestedCycleData` (processed/nested)
- **Why Both?**
  - `CycleData`: Flat collections for simple iteration (areas, assignees, stages, cycles)
  - `NestedCycleData`: Hierarchical structure for complex filtering and display
  - Both are needed simultaneously by coordinator methods
- **Computed Properties:**
  - `roadmapData`: For roadmap view
  - `filteredRoadmapData`: Filtered version
  - `cycleOverviewData`: For cycle overview view
  - `filteredCycleOverviewData`: Filtered version

### 8. Vue Component Layer

**Location:** `apps/web/src/components/`

- **Input:** `NestedCycleData` from store
- **Components:**
  - `Roadmap.vue`: Displays objectives and roadmap items
  - `CycleOverview.vue`: Displays cycle-specific view with progress

## Data Format Transformations

### Format 1: JIRA Raw Data

```typescript
JiraIssue {
  key: string
  fields: {
    summary: string
    status: JiraStatus
    assignee: JiraUser | null
    labels: string[]
    sprint?: JiraSprint
    // ... other fields
  }
}
```

### Format 2: CycleData (Backend & Frontend)

```typescript
CycleData {
  cycles: Cycle[]
  roadmapItems: RoadmapItem[]
  cycleItems: CycleItem[]
  areas: Area[]  // ← Flat array, teams associated within each area
  objectives: Objective[]
  assignees: Person[]
  stages: Stage[]
  teams?: Team[]  // Optional, teams are primarily in Area.teams
}
```

**Key Points:**

- Areas are stored as a flat array (`Area[]`) throughout the entire data flow
- Teams are associated with areas (each `Area` has a `teams: Team[]` property)
- Orphaned teams (not associated with any area) are assigned to `DEFAULT_AREA_UNASSIGNED`
- No transformation needed between backend and frontend for areas format

### Format 3: NestedCycleData (Processed)

```typescript
NestedCycleData {
  objectives: ObjectiveWithProgress[] {
    id: string
    name: string
    // + progress metrics (ProgressMetrics)
    roadmapItems: RoadmapItemWithProgress[] {
      id: string
      // + progress metrics (ProgressMetrics)
      cycleItems: CycleItem[]
    }
  }
}
```

**Key Points:**

- Hierarchical structure: `objectives → roadmapItems → cycleItems`
- Progress metrics calculated at each level
- Used for UI display and filtering

### Format 4: Progress Types

```typescript
// Pure progress calculations (no cycle metadata)
interface ProgressMetrics {
  progress: number;
  progressWithInProgress: number;
  progressByCycleItems: number;
  weeks: number;
  weeksDone: number;
  weeksInProgress: number;
  weeksNotToDo: number;
  weeksCancelled: number;
  weeksPostponed: number;
  weeksTodo: number;
  cycleItemsCount: number;
  cycleItemsDoneCount: number;
  percentageNotToDo: number;
}

// Cycle-specific metadata
interface CycleMetadata {
  startMonth: string;
  endMonth: string;
  daysFromStartOfCycle: number;
  daysInCycle: number;
  currentDayPercentage: number;
}

// Combined types
interface CycleWithProgress extends Cycle, ProgressMetrics, CycleMetadata {}
interface ObjectiveWithProgress extends Objective, ProgressMetrics {}
interface RoadmapItemWithProgress extends RoadmapItem, ProgressMetrics {}
```

**Key Points:**

- `ProgressMetrics`: Pure progress calculations, used by all progress types
- `CycleMetadata`: Cycle-specific date/time information, only used by cycles
- `CycleWithProgress`: Combines cycle data with progress and metadata
- `ObjectiveWithProgress` and `RoadmapItemWithProgress`: Only use progress metrics, not cycle metadata

## Key Design Decisions

### Areas Format: Array Throughout

- **Decision:** Areas stored as `Area[]` (flat array) from backend to frontend
- **Rationale:**
  - Consistent with other collections (objectives, assignees, teams are all arrays)
  - No unnecessary Record → Array transformation
  - Frontend can create lookup maps/indexes when needed for performance
  - Most frontend code uses `find()` for simple lookups

### Teams-Areas Association

- **Decision:** Teams are associated with areas; orphaned teams go to default area
- **Implementation:**
  - Each `Area` has a `teams: Team[]` property
  - Teams are associated with areas in adapter's `extractAreas()` method
  - Orphaned teams (not associated with any area) are assigned to `DEFAULT_AREA_UNASSIGNED`
  - Default area is automatically created if needed

### Progress Calculations

- **Decision:** All progress calculations happen in the frontend
- **Rationale:**
  - Single source of truth for progress calculations
  - Backend focuses on data collection, frontend handles presentation logic
  - Easier to maintain and test
  - More flexible for different progress calculation strategies

### Double Data Storage

- **Decision:** Store both `CycleData` (raw) and `NestedCycleData` (processed)
- **Rationale:**
  - Different data structures for different purposes:
    - `CycleData`: Flat collections for simple access patterns
    - `NestedCycleData`: Nested structure for complex filtering and hierarchical display
  - Coordinator methods require both simultaneously
  - Caching `NestedCycleData` avoids expensive re-computation

## Related Documentation

- [Architecture Overview](architecture.md) - High-level system design
- [JIRA Adapters](apps/api/src/adapters/README.md) - Adapter implementation details
- [Development Guide](development.md) - How to run and develop locally
