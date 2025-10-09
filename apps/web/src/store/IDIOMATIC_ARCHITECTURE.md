# Idiomatic TypeScript/Node.js Architecture

## The Question: `/lib` vs `/services`?

You asked a great question about where `DataProcessor` should live. This is a fundamental architectural decision that follows modern TypeScript/Node.js conventions.

## Modern TypeScript/Node.js Conventions

### **`/lib` - Pure Functions & Utilities**

- **Pure functions** (no side effects, same input = same output)
- **Data transformations** and calculations
- **Utility functions** and algorithms
- **Stateless operations**
- **Easy to test** (no mocking needed)
- **Reusable** across different contexts

### **`/services` - Business Operations & External Communication**

- **API calls** (HTTP, GraphQL, etc.)
- **Database operations**
- **Third-party integrations**
- **Stateful operations** with side effects
- **Business operations** that coordinate multiple systems
- **Operations that change external state**

## The Problem with the Original DataProcessor

The original `DataProcessor` was a **hybrid** that blurred these lines:

```typescript
// Pure data transformation (belongs in /lib)
processCycleData(rawData: CycleData, filters: FilterCriteria): NestedCycleData

// Business operations with side effects (belongs in /services)
updateFilter(key: string, value: any): ViewFilterCriteria  // Updates filter manager state
switchView(page: string): ViewFilterCriteria              // Updates filter manager state
initializeFilters(currentFilters: ViewFilterCriteria): void // Initializes external state
```

## The Solution: Split Responsibilities

### 1. **DataTransformer** (`/lib/data-transformer.ts`)

**Pure functions with no side effects**

```typescript
export class DataTransformer {
  // Pure data transformation - no side effects
  static transformToNestedStructure(rawData: CycleData): NestedCycleData;
  static processCycleData(
    rawData: CycleData,
    filters: FilterCriteria,
  ): NestedCycleData;
  static generateRoadmapData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
  ): RoadmapData;
  static generateFilteredRoadmapData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
    activeFilters: FilterCriteria,
  ): RoadmapData;
}
```

**Why in `/lib`?**

- ✅ Pure functions (no side effects)
- ✅ Easy to test (no mocking needed)
- ✅ Reusable across different contexts
- ✅ Stateless operations
- ✅ Data transformations and calculations

### 2. **DataService** (`/services/data-service.ts`)

**Business operations with side effects**

```typescript
export class DataService {
  // Business operations - coordinate pure transformations
  processCycleData(rawData: CycleData): NestedCycleData;
  generateRoadmapData(
    rawData: CycleData | null,
    processedData: NestedCycleData | null,
  ): RoadmapData;

  // Operations with side effects - update external state
  updateFilter(key: string, value: any): ViewFilterCriteria; // Updates filter manager
  switchView(page: string): ViewFilterCriteria; // Updates filter manager
  initializeFilters(currentFilters: ViewFilterCriteria): void; // Initializes external state
}
```

**Why in `/services`?**

- ✅ Business operations that coordinate multiple systems
- ✅ Operations with side effects (updates filter manager state)
- ✅ Stateful operations
- ✅ Integrates with external systems (ViewFilterManager)

## Final Architecture

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
                       │   DataService    │    │  Composables    │
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

## File Structure

```
src/
├── services/                    # Business operations & external communication
│   ├── cycle-data-service.ts   # API communication
│   ├── data-service.ts         # Business operations with side effects
│   └── index.ts               # Service exports
├── lib/                       # Pure functions & utilities
│   ├── data-transformer.ts    # Pure data transformations
│   ├── cycle-selector.ts      # Pure cycle selection logic
│   ├── cycle-progress-calculator.ts # Pure progress calculations
│   ├── calculations/          # Pure calculation functions
│   ├── filters/              # Pure filter logic
│   └── constants/            # Pure constants
├── composables/              # Reactive logic layer
│   ├── useCycleData.ts       # Reactive cycle data
│   ├── useFilters.ts         # Reactive filter management
│   └── useStoreData.ts       # Store integration
└── store/                    # State management
    └── simplified-store.ts   # Pure state management
```

## Benefits of This Approach

### 1. **Clear Separation of Concerns**

- **`/lib`**: Pure functions, easy to test, reusable
- **`/services`**: Business operations, side effects, external coordination

### 2. **Follows TypeScript/Node.js Conventions**

- Aligns with community standards
- Easy for new developers to understand
- Consistent with popular frameworks (NestJS, Express, etc.)

### 3. **Better Testability**

```typescript
// Easy to test pure functions
import { DataTransformer } from "@/lib/data-transformer";

describe("DataTransformer", () => {
  it("should transform raw data correctly", () => {
    const result = DataTransformer.processCycleData(rawData, {});
    expect(result.initiatives).toHaveLength(3);
  });
});

// Services can be mocked for integration tests
import { dataService } from "@/services/data-service";
jest.mock("@/services/data-service");
```

### 4. **Improved Maintainability**

- Changes to data transformation don't affect business operations
- Changes to business operations don't affect pure functions
- Clear boundaries make debugging easier

### 5. **Better Reusability**

```typescript
// Pure functions can be used anywhere
import { DataTransformer } from "@/lib/data-transformer";

// In a test
const testData = DataTransformer.processCycleData(mockData, {});

// In a worker thread
const processedData = DataTransformer.processCycleData(rawData, filters);

// In a different service
const transformedData = DataTransformer.transformToNestedStructure(apiData);
```

## Usage Examples

### Pure Data Transformation (lib)

```typescript
import { DataTransformer } from "@/lib/data-transformer";

// Pure function - no side effects
const processedData = DataTransformer.processCycleData(rawData, filters);
const roadmapData = DataTransformer.generateRoadmapData(rawData, processedData);
```

### Business Operations (services)

```typescript
import { dataService } from "@/services/data-service";

// Business operation - coordinates pure transformation
const processedData = dataService.processCycleData(rawData);

// Business operation - has side effects (updates filter manager)
const updatedFilters = dataService.updateFilter("area", "frontend");
```

## Conclusion

This architecture follows **modern TypeScript/Node.js conventions** by:

1. **Separating pure functions** (`/lib`) from **business operations** (`/services`)
2. **Making testing easier** with pure functions that don't need mocking
3. **Improving maintainability** with clear boundaries
4. **Following community standards** that other developers will recognize
5. **Enabling better reusability** of pure functions across different contexts

The key insight is that **pure data transformations belong in `/lib`** while **business operations with side effects belong in `/services`**. This creates a clean, maintainable, and idiomatic architecture that follows modern TypeScript/Node.js best practices.
