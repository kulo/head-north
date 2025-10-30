<!-- ba6bd4ff-7169-4a47-af49-314fbf7e8d97 b8c88ff5-3c3a-4674-a17d-6de53ff58281 -->

# Functional Programming Adoption for Omega

## Core Objectives

1. **Transform side effects to pure functions** - Identify and refactor impure code
2. **Enforce immutability** - Use `const` and `readonly` everywhere possible
3. **Adopt purify-ts** - TypeScript-first FP library for error handling, optional values, and validation (with tree-shaking to keep bundle footprint small)

---

## Library Stack: purify-ts + Complementary Libraries

### Primary Library: purify-ts

**purify-ts** is a TypeScript-first functional programming library that provides monadic types and utilities for safer, more expressive code.

#### Modules to Adopt ✅

**1. Maybe** - Safe optional value handling

- Replace `null`/`undefined` checks with `Maybe`
- Use `Maybe.fromNullable()`, `map()`, `orDefault()`
- **Use cases:** Optional properties, nullable API responses, safe property access

**2. Either** - Explicit error handling

- Replace try-catch with `Either<Error, Success>`
- Use `Left()` for errors, `Right()` for success
- **Use cases:** API calls, validation, operations that can fail

**3. Validation** - Accumulate multiple errors

- Validate multiple fields and collect all errors
- Use `Validation.lift2`, `lift3`, etc. for combining validations
- **Use cases:** Form validation, data validation at API boundaries

**4. Async/Task** - Functional async operations

- Replace Promises with `Async` for better composition
- Use `Async.fromPromise()` for Promise interop
- **Use cases:** API calls, async data transformations

**5. List** - Immutable list operations

- Functional array operations with immutability
- Chain operations without mutating original array
- **Use cases:** Data transformations, filtering, mapping

#### Modules to Skip or Defer ❌

**1. Reader** - Dependency injection

- **Skip for now:** Adds complexity, can use regular DI patterns
- **Future consideration:** Only if need for advanced dependency management

**2. State** - Stateful computations

- **Skip for now:** Pinia handles state management
- **Future consideration:** Only if need for complex state transitions

**3. IO** - Side effect management

- **Skip for now:** Adds abstraction layer that may confuse team
- **Future consideration:** Only if need for advanced effect systems

### Complementary Libraries

**1. Zod** - Runtime validation and schema validation

- **Purpose:** Validate data at API boundaries, form validation
- **Why Zod over io-ts:**
  - Better TypeScript inference
  - More modern API
  - Better error messages
  - Excellent developer experience
- **Use cases:** API request/response validation, environment variable validation

**2. ts-pattern** - Pattern matching

- **Purpose:** Exhaustive pattern matching with type inference
- **Why ts-pattern:**
  - Exhaustive matching (compile-time safety)
  - Smart type inference
  - Clean syntax
- **Use cases:** Status handling, discriminated unions, complex conditionals

**3. immer** - Immutable updates (optional)

- **Purpose:** Makes immutable updates easier in stores
- **Use cases:** Complex state updates in Pinia stores
- **Note:** Can use native spread operators, but immer can help with nested updates

---

## Analysis: Current State

### Already Functional ✅

**packages/jira-primitives** - Pure functions, no side effects

- `extractors.ts` - All pure extraction functions
- `transformers.ts` - Pure data transformations
- `validators.ts` - Pure validation functions

**apps/web/src/lib** - Mostly functional

- `calculations/cycle-calculations.ts` - Pure calculation functions
- `transformers/data-transformer.ts` - Pure transformation pipelines
- `cycle-progress-calculator.ts` - Pure business logic

### Needs Improvement ⚠️

**Classes with Mutable State:**

- `OmegaConfig` - Has `set()` method, mutates config
- `CycleDataService` - Mutates cache (`#cache = data`)
- `ViewFilterManager` - Mutates `currentView` and `viewFilters`
- `Filter` - Class-based, could be pure functions
- `JiraAPI` - Deprecated but still has mutable client

**Functions with Side Effects:**

- API route handlers - Mix I/O with business logic
- Store actions - Mutate state directly
- Component methods - Side effects mixed with logic

**Variables:**

- Many `let` declarations that could be `const`
- Missing `readonly` on class fields and interface properties

---

## Low-Hanging Fruits (Quick Wins)

### 1. Add `const` Everywhere (1-2 days)

**Impact:** High | **Effort:** Low | **Risk:** Very Low

Search and replace `let` with `const` where variables aren't reassigned.

**Files to target:**

- `apps/web/src/lib/calculations/cycle-calculations.ts`
- `apps/web/src/lib/transformers/data-transformer.ts`
- `apps/api/src/services/collect-cycle-data.ts`
- All store files

**Example:**

```typescript
// BEFORE
let weeks = 0;
let weeksDone = 0;
releaseItems.forEach((item) => {
  weeks += item.effort;
});

// AFTER
const weeks = releaseItems.reduce((sum, item) => sum + item.effort, 0);
const weeksDone = releaseItems
  .filter(isCompleted)
  .reduce((sum, item) => sum + item.effort, 0);
```

### 2. Add `readonly` to Types (2-3 days)

**Impact:** High | **Effort:** Low | **Risk:** Low

Add `readonly` to all interface properties in `@omega/types`.

**Files:**

- `packages/types/src/domain-types.ts` - All interfaces
- `apps/web/src/types/ui-types.ts` - All interfaces
- `packages/config/src/types.ts` - All interfaces

**Example:**

```typescript
// BEFORE
export interface Cycle {
  id: string;
  name: string;
  start: ISODateString;
  end: ISODateString;
}

// AFTER
export interface Cycle {
  readonly id: string;
  readonly name: string;
  readonly start: ISODateString;
  readonly end: ISODateString;
}
```

### 3. Remove OmegaConfig.set() Method (1 day)

**Impact:** Medium | **Effort:** Very Low | **Risk:** Very Low

Config should be immutable - remove the `set()` method. **SAFE TO REMOVE** - only used in tests, no production usage.

**Files:**

- `packages/config/src/omega-config.ts` - Remove `set()` method
- `packages/config/tests/omega-config.test.ts` - Remove test for `set()` method

```typescript
// REMOVE this method (no production usage found):
set(key: string, value: any): void {
  // mutation!
}

// REMOVE this test:
it("should set and get custom configuration", () => {
  config.set("customKey", "customValue");
  expect(config.get("customKey")).toBe("customValue");
});
```

### 4. Install purify-ts + Complementary Libraries (1 day)

**Impact:** High | **Effort:** Very Low | **Risk:** Very Low

```bash
npm install purify-ts zod ts-pattern
npm install --save-dev @types/zod
```

Configure tree-shaking in build configs to keep bundle footprint small.

**Library breakdown:**

- **purify-ts**: ~15-30KB (tree-shakeable to ~10-20KB)
- **zod**: ~10-15KB (tree-shakeable)
- **ts-pattern**: ~2-5KB
- **Total**: ~25-50KB (tree-shakeable to ~15-30KB)

---

## Medium-Hanging Fruits (Moderate Effort)

### 5. Refactor Filter Class to Functions (3-4 days)

**Impact:** High | **Effort:** Medium | **Risk:** Medium

**File:** `apps/web/src/lib/utils/filter.ts`

Convert class-based filtering to pure functions with purify-ts `List` and `Either`.

**Current:** 393 lines, class with methods

**Target:** Pure functions, composable, using `List` for immutable operations

### 6. Refactor Calculation Functions (4-5 days)

**Impact:** High | **Effort:** Medium | **Risk:** Low

**File:** `apps/web/src/lib/calculations/cycle-calculations.ts`

Replace imperative loops with functional operations using purify-ts `List`.

**Current:** 278 lines with `forEach`, `let` mutations

**Target:** Pure pipelines with `List` operations

### 7. Make CycleDataService Cache Immutable (3-4 days)

**Impact:** Medium | **Effort:** Medium | **Risk:** Medium

**File:** `apps/web/src/services/cycle-data-service.ts`

Stop mutating cache, use immutable patterns. Use `Maybe` for optional cache values.

```typescript
// BEFORE
this.#cache = data; // mutation!

// AFTER
readonly #cache: ReadonlyMap<string, CycleData>;
// Use Maybe<CycleData> for cache lookups
```

### 8. Convert ViewFilterManager to Factory Function (3-4 days)

**Impact:** Medium | **Effort:** Medium | **Risk:** Medium

**File:** `apps/web/src/services/view-filter-manager.ts`

Replace class with factory function that returns immutable manager.

---

## High-Hanging Fruits (Major Refactoring)

### 9. Separate I/O from Business Logic in API (5-7 days)

**Impact:** Very High | **Effort:** High | **Risk:** Medium

**Files:**

- `apps/api/src/controllers/*`
- `apps/api/src/routes/*`

Extract pure business logic from route handlers. Use `Either` for error handling, `Async` for async operations.

```typescript
// BEFORE
router.get("/cycle-data", async (ctx) => {
  const data = await fetchData(); // I/O
  const processed = transform(data); // business logic
  ctx.body = processed; // I/O
});

// AFTER
import { Either, Async } from "purify-ts";

const processCycleData = (rawData: RawData): Either<Error, ProcessedData> => {
  // Pure business logic!
  return transform(rawData);
};

router.get("/cycle-data", async (ctx) => {
  const result = await Async.fromPromise(fetchData)()
    .chain((data) => Async.liftEither(processCycleData(data)))
    .run();

  ctx.body = result.isLeft()
    ? { error: result.extract() }
    : { data: result.extract() };
});
```

### 10. Refactor Pinia Stores for Immutability (5-7 days)

**Impact:** Very High | **Effort:** High | **Risk:** High

**Files:**

- `apps/web/src/stores/data-store.ts`
- `apps/web/src/stores/filters-store.ts`
- `apps/web/src/stores/app-store.ts`

Ensure all state updates are immutable. Use `Maybe` for optional state values.

```typescript
// BEFORE
function updateFilter(key, value) {
  this.filters[key] = value; // mutation!
}

// AFTER
import { Maybe } from "purify-ts";

function updateFilter(key, value) {
  this.filters = { ...this.filters, [key]: value };
}

// Use Maybe for optional values
const activeFilter = Maybe.fromNullable(this.filters[key])
  .map((filter) => transformFilter(filter))
  .orDefault(DEFAULT_FILTER);
```

### 11. Extract Pure Logic from Vue Components (7-10 days)

**Impact:** Very High | **Effort:** High | **Risk:** Medium

**Files:** All `.vue` components

Move business logic to composables and pure functions. Use `Maybe` and `Either` for safe operations.

```typescript
// BEFORE (in component)
const calculateProgress = () => {
  let total = 0;
  items.value.forEach((item) => (total += item.effort));
  return total;
};

// AFTER (in composable)
// composables/useProgress.ts
import { List, Maybe } from "purify-ts";

export const calculateProgress = (items: ReleaseItem[]) =>
  List(items)
    .map((item) => Maybe.fromNullable(item.effort).orDefault(0))
    .foldr((acc, effort) => acc + effort, 0);
```

### 12. Add Zod Validation at API Boundaries (3-4 days)

**Impact:** High | **Effort:** Medium | **Risk:** Low

**Files:**

- `apps/api/src/middleware/*`
- `apps/api/src/controllers/*`

Use Zod to validate incoming requests and outgoing responses.

```typescript
// apps/api/src/middleware/validation.ts
import { z } from "zod";

const CycleDataSchema = z.object({
  cycles: z.array(CycleSchema),
  roadmapItems: z.array(RoadmapItemSchema),
});

export const validateCycleData = (data: unknown) =>
  CycleDataSchema.safeParse(data);
```

### 13. Use ts-pattern for Pattern Matching (2-3 days)

**Impact:** Medium | **Effort:** Low | **Risk:** Low

Replace complex if-else chains with pattern matching.

```typescript
// BEFORE
function handleStatus(status: string) {
  if (status === "done") return "completed";
  if (status === "inprogress") return "active";
  if (status === "todo") return "pending";
  return "unknown";
}

// AFTER
import { match } from "ts-pattern";

function handleStatus(status: string) {
  return match(status)
    .with("done", () => "completed")
    .with("inprogress", () => "active")
    .with("todo", () => "pending")
    .otherwise(() => "unknown");
}
```

---

## Implementation Strategy

### Phase 1: Quick Wins (Week 1-2)

**Goal:** Build momentum, show immediate value

1. Add `const` everywhere (automated with linter rules)
2. Add `readonly` to all types
3. Remove `OmegaConfig.set()`
4. Install purify-ts, Zod, ts-pattern

**Deliverable:**

- 90%+ variables use `const`
- All types have `readonly`
- FP libraries available for use

### Phase 2: Core Refactoring (Week 3-6)

**Goal:** Transform key components to functional style

5. Refactor Filter class to functions (with purify-ts `List`)
6. Refactor calculation functions (with purify-ts `List`)
7. Make CycleDataService cache immutable (with `Maybe`)
8. Convert ViewFilterManager to factory
9. Add Zod validation at API boundaries

**Deliverable:**

- Core utilities are pure functions
- Services use immutable patterns
- purify-ts used throughout lib layer
- API boundaries validated with Zod

### Phase 3: System-Wide Changes (Week 7-11)

**Goal:** Apply FP principles across entire codebase

10. Separate I/O from business logic in API (with `Either`/`Async`)
11. Refactor Pinia stores for immutability (with `Maybe`)
12. Extract pure logic from components
13. Use ts-pattern for pattern matching

**Deliverable:**

- 80%+ functions are pure
- All state updates are immutable
- Clear separation of concerns
- Type-safe error handling with `Either`

---

## Detailed Examples

### Example 1: Calculation with purify-ts List

**File:** `apps/web/src/lib/calculations/cycle-calculations.ts`

```typescript
// BEFORE (imperative, mutations)
export const calculateReleaseItemProgress = (
  releaseItems: ReleaseItem[],
): ProgressMetrics => {
  let weeks = 0;
  let weeksDone = 0;
  let weeksInProgress = 0;

  releaseItems.forEach((item) => {
    const effort = parseFloat(String(item.effort)) || 0;
    weeks += effort;

    if (isCompleted(item.status)) {
      weeksDone += effort;
    } else if (isInProgress(item.status)) {
      weeksInProgress += effort;
    }
  });

  return { weeks, weeksDone, weeksInProgress };
};

// AFTER (functional with purify-ts)
import { List, Maybe } from "purify-ts";

const parseEffort = (item: ReleaseItem): number =>
  Maybe.fromNullable(item.effort)
    .map((effort) => parseFloat(String(effort)))
    .filter((effort) => !isNaN(effort))
    .orDefault(0);

export const calculateReleaseItemProgress = (
  releaseItems: ReleaseItem[],
): ProgressMetrics => {
  const items = List(releaseItems);

  const weeks = items.map(parseEffort).foldr((acc, effort) => acc + effort, 0);

  const weeksDone = items
    .filter((item) => isCompleted(item.status))
    .map(parseEffort)
    .foldr((acc, effort) => acc + effort, 0);

  const weeksInProgress = items
    .filter((item) => isInProgress(item.status))
    .map(parseEffort)
    .foldr((acc, effort) => acc + effort, 0);

  return { weeks, weeksDone, weeksInProgress };
};
```

### Example 2: Error Handling with Either

**File:** `apps/web/src/services/cycle-data-service.ts`

```typescript
// BEFORE (try-catch)
async #request(endpoint: string): Promise<RawCycleData> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// AFTER (with purify-ts Either + Async)
import { Either, Async, Left, Right } from 'purify-ts'

const #request = (endpoint: string): Async<Either<Error, RawCycleData>> =>
  Async.fromPromise(() => fetch(url))
    .chain(response =>
      response.ok
        ? Async.fromPromise(() => response.json()).map(Right)
        : Async.resolve(Left(new Error(`HTTP ${response.status}`)))
    )
    .catch(error => Async.resolve(Left(new Error(`Request failed: ${error}`))))

// Usage
const result = await this.#request('/cycle-data').run();
result.ifLeft(error => console.error(error));
result.ifRight(data => processData(data));
```

### Example 3: Validation with Zod + purify-ts

**File:** `apps/api/src/middleware/validation.ts`

```typescript
import { z } from "zod";
import { Either, Left, Right } from "purify-ts";

const CycleDataSchema = z.object({
  cycles: z.array(CycleSchema),
  roadmapItems: z.array(RoadmapItemSchema),
  releaseItems: z.array(ReleaseItemSchema),
});

export const validateCycleData = (
  data: unknown,
): Either<z.ZodError, RawCycleData> => {
  const result = CycleDataSchema.safeParse(data);
  return result.success ? Right(result.data) : Left(result.error);
};

// Usage in controller
const validated = validateCycleData(req.body);
validated.ifLeft((errors) => (ctx.status = 400));
validated.ifRight((data) => processData(data));
```

### Example 4: Optional Values with Maybe

**File:** `apps/web/src/lib/utils/filter.ts`

```typescript
// BEFORE (null checks)
private matchesArea(releaseItem: ReleaseItem, area: AreaId): boolean {
  if (!releaseItem.area) return false;

  if (typeof releaseItem.area === 'string') {
    return releaseItem.area === area;
  }

  if (typeof releaseItem.area === 'object' && 'id' in releaseItem.area) {
    return releaseItem.area.id === area;
  }

  return false;
}

// AFTER (with purify-ts Maybe)
import { Maybe } from 'purify-ts'

const matchesArea = (releaseItem: ReleaseItem, area: AreaId): boolean =>
  Maybe.fromNullable(releaseItem.area)
    .map(a => typeof a === 'string' ? a : a.id)
    .map(id => id === area)
    .orDefault(false)
```

### Example 5: Pattern Matching with ts-pattern

**File:** `apps/web/src/lib/constants/status-constants.ts`

```typescript
// BEFORE (if-else chain)
export function normalizeStatus(status: string): string {
  if (status === "done" || status === "completed" || status === "closed") {
    return "done";
  }
  if (status === "inprogress" || status === "in-progress") {
    return "inprogress";
  }
  if (status === "todo" || status === "to-do") {
    return "todo";
  }
  return "todo";
}

// AFTER (with ts-pattern)
import { match } from "ts-pattern";

export function normalizeStatus(status: string): string {
  return match(status.toLowerCase())
    .with("done", "completed", "closed", () => "done")
    .with("inprogress", "in-progress", () => "inprogress")
    .with("todo", "to-do", () => "todo")
    .otherwise(() => "todo");
}
```

### Example 6: Filter as Pure Functions

**File:** `apps/web/src/lib/utils/filter.ts`

```typescript
// BEFORE (class with state)
export class Filter {
  apply(data: NestedCycleData, criteria: FilterCriteria): FilterResult {
    const filteredInitiatives = data.initiatives
      .map((initiative) => this.filterInitiative(initiative, criteria))
      .filter((initiative) => initiative.roadmapItems.length > 0);
    // ... more imperative code
  }
}

// AFTER (pure functions with purify-ts)
import { List, Maybe } from "purify-ts";

const matchesCriteria =
  (criteria: FilterCriteria) =>
  (item: ReleaseItem): boolean => {
    const areaMatch = Maybe.fromNullable(criteria.area)
      .map((area) => item.area === area || item.areaIds?.includes(area))
      .orDefault(true);

    const cycleMatch = Maybe.fromNullable(criteria.cycle)
      .map((cycle) => item.cycleId === cycle)
      .orDefault(true);

    return areaMatch && cycleMatch;
  };

const filterReleaseItems = (criteria: FilterCriteria) =>
  List.filter(matchesCriteria(criteria));

const filterRoadmapItems =
  (criteria: FilterCriteria) => (roadmapItems: RoadmapItem[]) =>
    List(roadmapItems)
      .map((item) => ({
        ...item,
        releaseItems: filterReleaseItems(criteria)(item.releaseItems).toArray(),
      }))
      .filter((item) => item.releaseItems.length > 0)
      .toArray();

export const filter =
  (criteria: FilterCriteria) =>
  (data: NestedCycleData): FilterResult => {
    const filteredInitiatives = List(data.initiatives)
      .map((init) => ({
        ...init,
        roadmapItems: filterRoadmapItems(criteria)(init.roadmapItems),
      }))
      .filter((init) => init.roadmapItems.length > 0)
      .toArray();

    return {
      data: { initiatives: filteredInitiatives },
      appliedFilters: criteria,
      totalInitiatives: filteredInitiatives.length,
    };
  };
```

---

## Success Metrics

### Code Quality Targets

- **80%+** functions are pure (no side effects)
- **90%+** variables use `const`
- **70%+** types use `readonly`
- **50%+** error handling uses `Either`
- **50%+** optional values use `Maybe`

### Before/After Comparison

| Metric | Before | Target |

|--------|--------|--------|

| Pure functions | ~40% | 80% |

| `const` usage | ~60% | 90% |

| `readonly` types | ~10% | 70% |

| purify-ts adoption | 0% | 50% |

| Zod validation | 0% | 80% (API boundaries) |

| Pattern matching | 0% | 30% (status/type handling) |

### Quality Improvements

- Fewer bugs from mutations
- Easier testing (pure functions)
- Better code reuse
- Clearer data flow
- Type-safe error handling
- No null/undefined errors

---

## Risk Mitigation

1. **Breaking Changes**
   - Comprehensive test coverage before refactoring
   - Refactor one file at a time
   - Use feature flags for major changes

2. **Performance**
   - Profile before/after each phase
   - Monitor bundle size (target: +15-30KB max with tree-shaking)
   - Optimize hot paths if needed

3. **Team Adoption**
   - Training workshops (FP fundamentals, purify-ts, Zod, ts-pattern)
   - Pair programming sessions
   - Code review checklist
   - Document patterns and examples

4. **Learning Curve**
   - Start with low-hanging fruits
   - Gradual adoption of purify-ts (Maybe → Either → Validation)
   - Clear examples for common patterns
   - Regular knowledge sharing

---

## Library Installation & Setup

### Installation

```bash
# Core FP library
npm install purify-ts

# Runtime validation
npm install zod

# Pattern matching
npm install ts-pattern

# Optional: Immutable updates (if needed for complex stores)
npm install immer
```

### TypeScript Configuration

Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Bundle Optimization

Configure tree-shaking in your build tools:

- **Webpack**: Already supports tree-shaking for ES modules
- **Vite**: Already supports tree-shaking
- **esbuild**: Already supports tree-shaking

Import only what you need:

```typescript
// ✅ Good - tree-shakeable
import { Maybe, Either, List } from 'purify-ts'

// ❌ Bad - imports everything
import * from 'purify-ts'
```

### To-dos

- [ ] Install purify-ts, Zod, ts-pattern
- [ ] Configure tree-shaking in build tools
- [ ] Add readonly modifiers to all @omega/types interfaces
- [ ] Convert @omega/utils to pure functions with purify-ts
- [ ] Enhance @omega/jira-primitives with purify-ts utilities
- [ ] Make OmegaConfig fully immutable (remove set method, add readonly)
- [ ] Convert API adapters to pure functions with Either error handling
- [ ] Refactor API services for immutable state management with Maybe
- [ ] Make API route handlers pure functions
- [ ] Add Zod validation at API boundaries
- [ ] Enhance web transformers with purify-ts List
- [ ] Convert Filter class to functional API with purify-ts
- [ ] Refactor web services (CycleDataService, ViewFilterManager) with Maybe/Either
- [ ] Ensure Pinia stores use immutable state patterns
- [ ] Refactor components to use Composition API with pure computed
- [ ] Implement Either/Option for error handling across codebase
- [ ] Use ts-pattern for pattern matching in status/type handling
- [ ] Create composable data transformation pipelines
- [ ] Create FP guidelines and migration documentation
- [ ] Conduct team training workshops on FP patterns (purify-ts, Zod, ts-pattern)
