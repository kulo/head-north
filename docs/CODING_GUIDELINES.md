# Coding Guidelines

This document provides comprehensive coding guidelines for the Head North codebase. It covers functional programming patterns, TypeScript best practices, code organization, testing, and more.

## Table of Contents

1. [Philosophy & Principles](#philosophy--principles)
2. [Quick Reference](#quick-reference) - API cheat sheet
3. [TypeScript Best Practices](#typescript-best-practices)
4. [Functional Programming Patterns](#functional-programming-patterns)
5. [Code Organization](#code-organization)
6. [Testing Guidelines](#testing-guidelines)
7. [Error Handling](#error-handling)
8. [Immutability & Side Effects](#immutability--side-effects)
9. [Common Patterns](#common-patterns)
10. [Anti-patterns to Avoid](#anti-patterns-to-avoid)

---

## Philosophy & Principles

Head North follows these core principles:

1. **Functional Programming First**: Prefer pure functions, immutability, and explicit error handling
2. **Type Safety**: Leverage TypeScript's type system fully - avoid `any`, use strict mode
3. **Separation of Concerns**: Business logic separate from I/O, UI logic separate from presentation
4. **Testability**: Code should be easy to test - pure functions are naturally testable
5. **Explicit over Implicit**: Explicit error handling (`Either`) over exceptions, explicit optional values (`Maybe`) over null checks

---

## Quick Reference

A quick API reference for common FP patterns. For detailed explanations and examples, see the sections below.

### Import Statements

```typescript
import { Maybe, Either, Left, Right } from "purify-ts";
import { match } from "ts-pattern";
import { z } from "zod";
import { pipe, safe, safeAsync } from "@headnorth/utils";
```

### Maybe (Optional Values)

```typescript
// Create
Maybe.fromNullable(value)          // Maybe<T | null | undefined>
Maybe.of(value)                     // Maybe<T> (non-nullable)

// Transform
maybe.map(fn)                       // Maybe<U>
maybe.chain(fn)                     // Maybe<U> (flatten)
maybe.filter(predicate)             // Maybe<T>

// Extract
maybe.orDefault(default)            // T
maybe.caseOf({ Nothing: ..., Just: ... })
maybe.isNothing()                   // boolean
maybe.isJust()                      // boolean
```

**Example:**

```typescript
const area = Maybe.fromNullable(item.area)
  .map((a) => a.id)
  .orDefault("unknown");
```

### Either (Error Handling)

```typescript
// Create
Left(error)                         // Either<Error, never>
Right(value)                        // Either<never, T>

// Transform
either.map(fn)                      // Either<E, U>
either.chain(fn)                    // Either<E, U> (flatten)
either.mapLeft(fn)                  // Either<E', T>

// Extract
either.caseOf({ Left: ..., Right: ... })
either.isLeft()                     // boolean
either.isRight()                    // boolean
either.ifLeft(fn)                   // void
either.ifRight(fn)                  // void
```

**Example:**

```typescript
const result: Either<Error, Data> = validateData(input);
result.caseOf({
  Left: (error) => console.error(error),
  Right: (data) => processData(data),
});
```

### Pattern Matching (ts-pattern)

```typescript
match(value)
  .with(pattern, handler) // Match specific value
  .with(p1, p2, p3, handler) // Match multiple values
  .when(predicate, handler) // Match with predicate
  .otherwise(handler) // Fallback
  .exhaustive(); // Compile-time exhaustiveness check
```

**Example:**

```typescript
match(status)
  .with("done", "completed", () => STATUS.DONE)
  .with("inprogress", () => STATUS.IN_PROGRESS)
  .otherwise(() => STATUS.TODO);
```

### Zod Validation

```typescript
// Schema
const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

// Validate
const result = schema.safeParse(data);
if (result.success) {
  const valid = result.data; // Typed!
} else {
  const errors = result.error.issues;
}

// With Either
function validate(data: unknown): Either<Error, ValidData> {
  const result = schema.safeParse(data);
  return result.success
    ? Right(result.data)
    : Left(new Error(formatErrors(result.error)));
}
```

### Functional Composition

```typescript
// Pipe (left to right)
pipe(
  input,
  fn1, // fn1(input)
  fn2, // fn2(fn1(input))
  fn3, // fn3(fn2(fn1(input)))
);

// Compose (right to left)
compose(fn3, fn2, fn1); // fn3(fn2(fn1(x)))
```

**Example:**

```typescript
const result = pipe(rawData, validateData, processData, formatForDisplay);
```

### Safe Wrappers

```typescript
// Sync - wraps function that might throw
safe(() => riskyOperation());
// Returns: Either<Error, Result>

// Async - wraps async function that might throw
safeAsync(() => asyncRiskyOperation());
// Returns: Promise<Either<Error, Result>>
```

**Example:**

```typescript
const result = await safeAsync(async () => {
  const response = await fetch(url);
  return response.json();
});

result.caseOf({
  Left: (error) => handleError(error),
  Right: (data) => processData(data),
});
```

### Decision Tree

**Need to handle optional value?**

- → Use `Maybe`

**Operation can fail?**

- → Use `Either<Error, T>`

**Multiple status/type branches?**

- → Use `match()` from ts-pattern

**Validate external data?**

- → Use `Zod` + `Either`

**Transform data through steps?**

- → Use `pipe()`

**Safe wrapper for try-catch?**

- → Use `safe()` or `safeAsync()`

---

## TypeScript Best Practices

### Type Safety

```typescript
// ✅ GOOD - Explicit types, strict mode enabled
function processData(data: RawCycleData): ProcessedCycleData {
  // TypeScript ensures type safety
}

// ❌ BAD - Using any defeats the purpose
function processData(data: any): any {
  // No type safety
}

// ✅ GOOD - Use unknown when type is truly unknown
function handleUnknown(input: unknown): Either<Error, ValidatedData> {
  // Must validate before use
}
```

### Readonly Types

```typescript
// ✅ GOOD - Immutable interface
interface Cycle {
  readonly id: string;
  readonly name: string;
  readonly start: ISODateString;
}

// ✅ GOOD - Readonly arrays in signatures
function processItems(items: readonly Item[]): readonly Item[] {
  return items.filter(predicate);
}
```

### Type Inference

```typescript
// ✅ GOOD - Let TypeScript infer when clear
const items = data.items; // Type inferred from data.items

// ✅ GOOD - Explicit when it improves clarity
function calculateProgress(items: readonly ReleaseItem[]): number {
  // Explicit return type improves documentation
}
```

### Strict Mode

Head North uses TypeScript strict mode. This means:

- `noImplicitAny`: All types must be explicit
- `strictNullChecks`: Null/undefined must be handled explicitly
- `strictFunctionTypes`: Function parameters are contravariant
- `strictPropertyInitialization`: Class properties must be initialized

---

## Functional Programming Patterns

### Pure Functions

**Always prefer**: Pure functions with no side effects

```typescript
// ✅ GOOD - Pure function
function calculateProgress(releaseItems: readonly ReleaseItem[]): number {
  const completed = releaseItems.filter((item) => item.status === "done");
  return (completed.length / releaseItems.length) * 100;
}

// ❌ BAD - Side effect (mutates external state)
function calculateProgress(releaseItems: ReleaseItem[]): number {
  let total = 0; // Mutation
  releaseItems.forEach((item) => (total += item.effort)); // Side effect
  return total;
}
```

**Real example**: `apps/web/src/lib/calculations/cycle-calculations.ts`

### Error Handling with Either

Use `Either<Error, Success>` for operations that can fail.

```typescript
import { Either, Left, Right } from "purify-ts";
import { safeAsync } from "@headnorth/utils";

// ✅ GOOD - Explicit error handling
async function fetchData(id: string): Promise<Either<Error, Data>> {
  return safeAsync(async () => {
    const response = await api.get(`/data/${id}`);
    return response.data;
  });
}

// Usage
const result = await fetchData("123");
result.caseOf({
  Left: (error) => console.error("Failed:", error),
  Right: (data) => processData(data),
});
```

**Real example**: `apps/api/src/services/collect-cycle-data.ts`

### Optional Values with Maybe

Replace `null`/`undefined` checks with `Maybe`.

```typescript
import { Maybe } from "purify-ts";

// ❌ AVOID - Null checks
function getArea(releaseItem: ReleaseItem): string | null {
  if (releaseItem.area) {
    return releaseItem.area.id;
  }
  return null;
}

// ✅ PREFER - Maybe
function getArea(releaseItem: ReleaseItem): Maybe<string> {
  return Maybe.fromNullable(releaseItem.area).map((area) => area.id);
}

// Usage with default
const area = getArea(item).orDefault("unknown");
```

**Real example**: `apps/web/src/lib/utils/filter.ts` - `matchesArea()`

### Pattern Matching with ts-pattern

Replace if-else chains with `match()` for exhaustive matching.

```typescript
import { match } from "ts-pattern";

// ❌ AVOID - if-else chain
function normalizeStatus(status: string): string {
  if (status === "done" || status === "completed") return "done";
  if (status === "inprogress") return "inprogress";
  return "todo";
}

// ✅ PREFER - Pattern matching
function normalizeStatus(status: string): string {
  return match(status.toLowerCase())
    .with("done", "completed", "closed", () => "done")
    .with("inprogress", "in-progress", () => "inprogress")
    .with("todo", "to-do", () => "todo")
    .otherwise(() => "todo");
}
```

**Real example**: `apps/web/src/lib/constants/status-constants.ts`

### Functional Composition

Use `pipe()` for left-to-right composition.

```typescript
import { pipe } from "@headnorth/utils";

// ✅ GOOD - Functional pipeline
const result = pipe(
  rawData,
  validateData, // Step 1: Validate
  processData, // Step 2: Process
  formatForDisplay, // Step 3: Format
);
```

**Real example**: `apps/web/src/lib/transformers/data-transformer.ts`

### Data Validation with Zod

Combine Zod with `Either` for functional validation.

```typescript
import { z } from "zod";
import { Either, Left, Right } from "purify-ts";

const jiraConnectionSchema = z.object({
  user: z.string().min(1, "User is required"),
  token: z.string().min(1, "Token is required"),
  host: z.string().url("Must be a valid URL"),
  boardId: z.number().int().positive(),
});

function validateJiraConfig(config: unknown): Either<Error, JiraConfigData> {
  const result = jiraConnectionSchema.safeParse(config);
  return result.success
    ? Right(result.data)
    : Left(new Error(formatZodErrors(result.error)));
}
```

**Real example**: `packages/config/src/jira-config-validation.ts`

---

## Code Organization

### File Structure

```
head-north/
├── apps/
│   ├── web/              # Frontend application
│   │   ├── src/
│   │   │   ├── components/  # Vue components (presentation)
│   │   │   ├── lib/         # Business logic (pure functions)
│   │   │   ├── services/    # Services (stateful, I/O)
│   │   │   ├── stores/      # Pinia stores (state management)
│   │   │   └── types/       # Type definitions
│   │   └── tests/
│   └── api/               # Backend API
│       ├── src/
│       │   ├── controllers/ # Route handlers (I/O layer)
│       │   ├── services/     # Business logic (pure functions)
│       │   ├── adapters/     # External integrations
│       │   ├── middleware/    # HTTP middleware
│       │   └── types/         # Type definitions
│       └── tests/
└── packages/              # Shared packages
    ├── types/             # Shared TypeScript types
    ├── utils/              # Shared utilities
    └── config/             # Configuration
```

### Separation of Concerns

- **Components (`.vue` files)**: Presentation only - minimal logic
- **Pure Functions (`lib/` directories)**: Business logic, no side effects
- **Services**: Stateful operations, I/O, caching
- **Stores**: State management, reactivity
- **Controllers**: HTTP layer, request/response handling

### Naming Conventions

```typescript
// ✅ GOOD - Descriptive names
function calculateCycleProgress(cycles: readonly Cycle[]): number {}
function getReleaseItemsForCycle(roadmapItem: RoadmapItem, cycleId: string) {}

// ❌ BAD - Vague names
function calc(c: Cycle[]): number {}
function getItems(item: RoadmapItem, id: string) {}
```

### Import Organization

```typescript
// 1. External libraries
import { Maybe, Either } from "purify-ts";
import { match } from "ts-pattern";
import { z } from "zod";

// 2. Internal packages (scoped)
import type { Cycle, ReleaseItem } from "@headnorth/types";
import { logger } from "@headnorth/utils";
import { HeadNorthConfig } from "@headnorth/config";

// 3. Relative imports
import { calculateProgress } from "../calculations/cycle-calculations";
import type { FilterCriteria } from "../../types/ui-types";
```

---

## Testing Guidelines

### Pure Functions

Pure functions are naturally testable - test inputs and outputs.

```typescript
import { describe, it, expect } from "vitest";
import { calculateProgress } from "../calculations/cycle-calculations";

describe("calculateProgress", () => {
  it("should calculate progress correctly", () => {
    const items = [
      { status: "done" },
      { status: "inprogress" },
      { status: "todo" },
    ];

    const progress = calculateProgress(items);
    expect(progress).toBe(33.33); // 1/3 completed
  });

  it("should handle empty arrays", () => {
    expect(calculateProgress([])).toBe(0);
  });
});
```

### Testing with Either

```typescript
import { Either } from "purify-ts";

it("should return Left on invalid input", () => {
  const result: Either<Error, ValidatedData> = validateData(invalid);
  expect(result.isLeft()).toBe(true);
  result.ifLeft((error) => {
    expect(error.message).toContain("invalid");
  });
});
```

### Testing with Maybe

```typescript
import { Maybe } from "purify-ts";

it("should return Nothing when area is missing", () => {
  const result = getArea(itemWithoutArea);
  expect(result.isNothing()).toBe(true);
});
```

### Test Organization

- One test file per source file
- Tests mirror source structure: `tests/lib/` for `src/lib/`
- Group related tests with `describe` blocks
- Use descriptive test names: `should calculate progress correctly`

### Updating Tests After Migration

When refactoring code to FP patterns, update tests accordingly:

**Before (testing null/undefined):**

```typescript
it("should return null when area is missing", () => {
  expect(getArea(itemWithoutArea)).toBeNull();
});
```

**After (testing Maybe):**

```typescript
import { Maybe } from "purify-ts";

it("should return Nothing when area is missing", () => {
  expect(getArea(itemWithoutArea).isNothing()).toBe(true);
});
```

**Before (testing exceptions):**

```typescript
it("should throw error on invalid input", () => {
  expect(() => processData(invalid)).toThrow();
});
```

**After (testing Either):**

```typescript
import { Either } from "purify-ts";

it("should return Left on invalid input", () => {
  const result = processData(invalid);
  expect(result.isLeft()).toBe(true);
  result.ifLeft((error) => {
    expect(error.message).toContain("invalid");
  });
});
```

---

## Error Handling

For business logic, use `Either<Error, T>` as described in [Error Handling with Either](#error-handling-with-either).

### Framework Layers

Use `try-catch` in framework layers (middleware, error handlers) where imperative error handling is appropriate.

```typescript
// ✅ GOOD - Framework error handling
export default async (context: Context, next: Next): Promise<void> => {
  try {
    await next();
  } catch (error) {
    handleError(context, error);
  }
};
```

### Critical Failures

Use `process.exit(1)` for critical startup failures to prevent running in an invalid state.

```typescript
// ✅ GOOD - Fail-fast on startup
const adapterResult = createJiraAdapter(config);
adapterResult.caseOf({
  Left: (error) => {
    logger.error(error);
    process.exit(1); // Don't start in invalid state
  },
  Right: (adapter) => adapter,
});
```

---

## Immutability & Side Effects

### Always Use const

```typescript
// ✅ GOOD
const items = [...data.items];
const filtered = items.filter(predicate);

// ❌ BAD
let items = data.items; // Mutation risk
items = items.filter(predicate);
```

### Immutable Updates

```typescript
// ✅ GOOD - Immutable update
const updated = {
  ...original,
  property: newValue,
};

// ✅ GOOD - Nested update
const updated = {
  ...original,
  nested: {
    ...original.nested,
    property: newValue,
  },
};
```

### Avoiding Side Effects

Avoid side effects by using pure functions. See [Pure Functions](#pure-functions) for detailed examples.

```typescript
// ❌ BAD - Side effect (mutates external state)
let total = 0;
items.forEach((item) => (total += item.value));

// ✅ GOOD - Pure function with reduce
const total = items.reduce((sum, item) => sum + item.value, 0);
```

---

## Common Patterns

### Pattern: Optional Chain

```typescript
// Before
const value = obj?.nested?.property ?? default;

// After
const value = Maybe.fromNullable(obj)
  .chain(o => Maybe.fromNullable(o.nested))
  .map(n => n.property)
  .orDefault(default);
```

### Pattern: Safe Property Access

```typescript
// Before
if (item.area && item.area.id) {
  return item.area.id;
}
return "unknown";

// After
return Maybe.fromNullable(item.area)
  .map((area) => area.id)
  .orDefault("unknown");
```

### Pattern: Validation Chain

Chain multiple validations using `pipe()` and `chain()`. See [Functional Composition](#functional-composition) for the basics.

```typescript
const result = pipe(
  input,
  validate1, // Either<Error, T>
  chain(validate2), // Either<Error, U>
  chain(validate3), // Either<Error, V>
  map(process), // Either<Error, Processed>
);
```

### Pattern: Component Logic Extraction

Extract business logic from components into pure functions. See [Pure Functions](#pure-functions) for the functional principles.

```typescript
// ❌ BAD - Logic in component
// InitiativeChart.vue
const calculateProgress = () => {
  let total = 0;
  items.value.forEach((item) => (total += item.effort));
  return total;
};

// ✅ GOOD - Pure function extracted
// lib/charts/initiative-chart-calculations.ts
export function calculateProgress(items: readonly ReleaseItem[]): number {
  return items.reduce((sum, item) => sum + (item.effort || 0), 0);
}

// InitiativeChart.vue - just uses the function
import { calculateProgress } from "../lib/charts/initiative-chart-calculations";
const progress = computed(() => calculateProgress(items.value));
```

**Real example**: `apps/web/src/lib/charts/initiative-chart-calculations.ts`

### Pattern: Converting Class to Factory Function

```typescript
// ❌ BAD - Class with mutable state
class ViewFilterManager {
  private currentView: PageId = "cycle-overview";
  private filters: ViewFilterCriteria = {};

  switchView(pageId: PageId): void {
    this.currentView = pageId; // Mutation
  }
}

// ✅ GOOD - Factory function with closure
function createViewFilterManager(config: HeadNorthConfig): ViewFilterManager {
  // State in closure (immutable updates)
  let currentView: PageId = "cycle-overview";
  let filters: ViewFilterCriteria = {};

  const switchView = (pageId: PageId): TypedFilterCriteria => {
    // Create new state (immutable)
    currentView = pageId;
    return getActiveFilters();
  };

  return {
    switchView,
    getCurrentView: () => currentView,
    // ... other methods
  };
}
```

**Real example**: `apps/web/src/services/view-filter-manager.ts`

### Pattern: Error Accumulation with Validation

```typescript
// ❌ BAD - Manual error collection
const errors = [];
if (!data.field1) errors.push("field1 required");
if (!data.field2) errors.push("field2 required");
if (errors.length > 0) throw new Error(errors.join(", "));

// ✅ GOOD - Using purify-ts Validation
import { Validation, Success, Failure } from "purify-ts";

const validateField1 = (data: unknown) =>
  data.field1 ? Success(data) : Failure(["field1 required"]);

const validateField2 = (data: unknown) =>
  data.field2 ? Success(data) : Failure(["field2 required"]);

const result = Validation.lift2(
  validateField1,
  validateField2,
  (valid1, valid2) => ({ ...valid1, ...valid2 }),
)(data);
```

### Pattern: Array Operations (Functional Style)

Use functional array methods instead of imperative loops. See [Immutability & Side Effects](#immutability--side-effects) for more details.

```typescript
// ❌ BAD - Imperative with mutations
let filtered = [];
items.forEach((item) => {
  if (predicate(item)) {
    filtered.push(transform(item));
  }
});

// ✅ GOOD - Functional composition
const filtered = items.filter(predicate).map(transform);
```

---

## Anti-patterns to Avoid

### 1. Using Maybe.extract()

```typescript
// ❌ BAD
const value = maybe.extract(); // Could be null!

// ✅ GOOD
const value = maybe.orDefault(defaultValue);
```

### 2. Mutating Arrays/Objects

```typescript
// ❌ BAD
items.push(newItem);
obj.property = newValue;

// ✅ GOOD
const updatedItems = [...items, newItem];
const updatedObj = { ...obj, property: newValue };
```

### 3. try-catch in Business Logic

```typescript
// ❌ BAD
function process(data: unknown) {
  try {
    return validate(data);
  } catch (error) {
    throw error;
  }
}

// ✅ GOOD
function process(data: unknown): Either<Error, ValidatedData> {
  return safe(() => validate(data));
}
```

### 4. Missing .exhaustive() in Pattern Matching

```typescript
// ❌ BAD - No compile-time safety
match(value)
  .with("case1", () => handle1())
  .otherwise(() => handleDefault());

// ✅ GOOD - Exhaustiveness check
match(value)
  .with("case1", () => handle1())
  .exhaustive(); // Fails if new case added
```

### 5. Using `any` Type

```typescript
// ❌ BAD
function process(data: any): any {}

// ✅ GOOD
function process(data: unknown): Either<Error, ProcessedData> {
  // Must validate before use
}
```

---

## Additional Resources

- **[Contributing Guide](../CONTRIBUTING.md)** - Contribution process
- **External Docs**:
  - [purify-ts](https://gigobyte.github.io/purify/)
  - [Zod](https://zod.dev/)
  - [ts-pattern](https://github.com/gvergnaud/ts-pattern)
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## Real Examples in Codebase

- **Error handling**: `apps/api/src/services/collect-cycle-data.ts`
- **Optional values**: `apps/web/src/lib/utils/filter.ts`
- **Pattern matching**: `apps/web/src/lib/constants/status-constants.ts`
- **Composition**: `packages/utils/src/purify-utils.ts`
- **Validation**: `packages/config/src/jira-config-validation.ts`
- **Component extraction**: `apps/web/src/lib/charts/initiative-chart-calculations.ts`
