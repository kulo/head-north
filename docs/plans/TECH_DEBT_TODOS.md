# Cleanup & Technical Debt TODOs

This document tracks important cleanup tasks, architectural decisions, and technical debt that should be addressed in future development cycles.

## 🚨 High Priority

### 1. **Decision: `generate-overview.ts` Integration or Removal** ❌ **OUTDATED - FILE NO LONGER EXISTS**

**File:** `apps/api/src/calculator/generate-overview.ts.disabled` (⚠️ **NOT FOUND**)

**Status:** ❌ **OUTDATED - File has been removed from codebase**

**Analysis (January 2025):**

- ✅ **File verification:** No `.disabled` files found in codebase
- ✅ **Directory check:** No `apps/api/src/calculator/` directory exists
- ✅ **GTM references:** Only found in UI component (`RoadmapItemOverview.vue`) and CSS styling
- ❌ **No GTM endpoint:** `/gtm-overview` endpoint does not exist in router
- ❌ **No GTM service:** No GTM validation service found

**Current State:**

- The file and its functionality have been completely removed
- GTM validation logic is no longer present in the codebase
- Only UI references remain (likely for display purposes only)

**Recommendation:**

- ✅ **Mark as completed/removed** - The code has been deleted, decision is resolved
- ⚠️ **If GTM validation is still needed:** This would require re-implementation from scratch
- 📝 **Action:** Remove this item from TODO list or mark as "No longer applicable"

**Effort:** N/A (already removed)

---

## 🔧 Medium Priority

### 2. **Type Safety Improvements** ✅ **PARTIALLY ADDRESSED - STILL RELEVANT**

**Files:** Multiple files across API and types

**Issue:** Some use of `unknown` types could be improved

**Current State (January 2025):**

- ✅ **Good:** Most Jira data structures have proper TypeScript interfaces (`JiraIssue`, `JiraSprint`, etc.)
- ✅ **Good:** Generic types appropriately use `unknown` as default (`ApiResponse<T = unknown>`, `ProcessingResult<T = unknown>`)
- ⚠️ **Needs improvement:** Found 28 uses of `unknown` across 9 files
- ⚠️ **Specific issues:**
  - `validations?: unknown[]` in `JiraIssue` (line 47 of `apps/api/src/types/jira-types.ts`)
  - `teams: z.array(z.unknown())` in validation schema (line 138 of `apps/api/src/middleware/validation.ts`)
  - `assignee?: Person | Record<string, unknown>` in `JiraIssue` (line 46)

**Tasks:**

- [x] ~~Add proper TypeScript interfaces for Jira data structures~~ ✅ **Already done**
- [x] ~~Replace `unknown` types with specific types in `generate-overview.ts`~~ ❌ **File doesn't exist**
- [ ] **Replace `validations?: unknown[]` with proper `ValidationItem[]` type**
- [ ] **Replace `z.array(z.unknown())` for teams with proper team schema**
- [ ] **Improve `assignee` type to avoid `Record<string, unknown>` fallback**
- [ ] Add type guards for runtime type checking where `unknown` is necessary

**Effort:** Low-Medium (1-2 days) - Reduced scope since most types are already defined

### 3. **API Architecture Consistency** ✅ **LARGELY RESOLVED - MINOR IMPROVEMENTS POSSIBLE**

**Context:** API architecture appears consistent, but worth verifying

**Current State (January 2025):**

- ✅ **Consistent endpoint:** Single `/cycle-data` endpoint returns processed data
- ✅ **Standardized format:** `prepareCycleDataResponse()` function standardizes response format
- ✅ **Type safety:** Response types are well-defined (`RawCycleData`, `ApiResponse<T>`)
- ✅ **Validation:** Zod schemas validate incoming/outgoing data
- ⚠️ **Note:** The concern about `generate-overview.ts` vs raw data is no longer relevant (file removed)

**Tasks:**

- [x] ~~Decide on consistent data processing approach~~ ✅ **Resolved - API returns processed data**
- [x] ~~Standardize response formats across all endpoints~~ ✅ **Done - Single unified format**
- [ ] **Consider adding response versioning** for future API evolution
- [ ] **Document API response format** in README or API docs

**Effort:** Low (0.5-1 day) - Mostly documentation/verification

---

## 🧹 Low Priority

### 4. **Test Coverage Gaps** ✅ **STILL RELEVANT**

**Status:** ✅ **Unit tests are comprehensive** (coverage configured, tests exist)

**Current State (January 2025):**

- ✅ **Test infrastructure:** Vitest configured with coverage reporting across all packages
- ✅ **Unit tests:** Comprehensive unit tests exist (adapters, services, utilities)
- ✅ **Service tests:** API service tests exist (`apps/web/tests/services/api-service.test.ts`)
- ❌ **Missing:** No integration tests for Koa routes/controllers found
- ❌ **Missing:** No E2E tests for Vue components
- ❌ **Missing:** No integration tests for actual Jira API calls (only mocked)

**Remaining Integration Testing Needs:**

- [ ] **API Integration Tests** - Add tests for Koa routes and HTTP controllers (currently using Koa, not Express)
- [ ] **Vue Component Tests** - Add integration/E2E tests for UI components
- [ ] **Service Layer Integration** - Add tests for real Jira API interactions (with test credentials)
- [ ] **End-to-End Testing** - Consider Cypress/Playwright for full user workflows

**Effort:** Medium (3-5 days)

### 5. **Test Infrastructure Enhancements** ✅ **STILL RELEVANT**

**Context:** Coverage is configured but thresholds not enforced

**Current State (January 2025):**

- ✅ **Coverage configured:** All vitest configs have coverage reporting enabled
- ✅ **Coverage providers:** Using v8 provider with text, json, html reporters
- ❌ **No thresholds:** No minimum coverage requirements set in configs
- ❌ **No CI enforcement:** Coverage thresholds not enforced in CI/CD
- ✅ **Test organization:** Tests follow consistent patterns (`tests/**/*.test.{js,ts}`)

**Immediate Actions:**

- [ ] **Coverage Thresholds** - Set minimum coverage requirements in vitest configs (e.g., `coverage: { thresholds: { lines: 80, branches: 80 } }`)
- [ ] **CI Integration** - Enforce coverage thresholds in CI/CD pipeline
- [ ] **Mutation Testing** - Consider Stryker for test quality validation
- [ ] **Performance Testing** - Add benchmarks for critical calculation functions

**Future Enhancements:**

- [ ] **Automated Coverage Reports** - Integrate coverage reporting into CI/CD (e.g., Codecov, Coveralls)
- [ ] **Test Quality Metrics** - Track test maintainability and effectiveness
- [ ] **Coverage Alerts** - Set up notifications for coverage drops

**Effort:** Low-Medium (2-3 days)

### 6. **Code Documentation** ✅ **PARTIALLY ADDRESSED - STILL RELEVANT**

**Current State (January 2025):**

- ✅ **Good documentation:** `cycle-progress-calculator.ts` has comprehensive JSDoc
- ✅ **Coding guidelines:** Extensive `docs/CODING_GUIDELINES.md` with examples
- ✅ **Type documentation:** Types are well-documented with comments
- ⚠️ **Unknown:** Need to verify all calculator functions have JSDoc
- ❌ **Missing:** No Architecture Decision Records (ADRs) found
- ❌ **N/A:** GTM validation business rules (code removed)

**Tasks:**

- [ ] **Audit calculator functions** - Verify all have JSDoc documentation
- [ ] **Create ADRs** - Document key architectural decisions (e.g., monorepo structure, functional programming patterns)
- [ ] ~~Document GTM validation business rules~~ ❌ **N/A - Code removed**
- [ ] **Add inline comments** - For complex business logic that lacks documentation

**Effort:** Low (1-2 days)

### 7. **Performance Optimization** ✅ **STILL RELEVANT**

**Tasks:**

- [ ] **Profile data transformation** - Measure performance of `collect-cycle-data.ts` and transformers
- [ ] **Optimize large dataset handling** - Test with large Jira datasets (1000+ issues)
- [ ] **Consider caching** - Add caching layer for frequently accessed data (e.g., cycle data)
- [ ] **Review memory usage** - Profile memory consumption during data processing
- [ ] **Benchmark critical paths** - Add performance benchmarks for calculation functions

**Effort:** Low (1-2 days)

---

## 📋 Completed Items

### ✅ **Test Coverage Implementation** (Completed)

- **Status:** 100% test success rate achieved (260/260 tests passing)
- **Coverage:** 87.47% branch coverage for business logic (exceeded 80% goal)
- **Performance:** <3 seconds total execution time
- **Files:** All critical business logic functions tested with comprehensive edge cases
- **Infrastructure:** Zero external dependencies, fast and reliable test suite
- **Date:** January 2025

### ✅ **JSDoc Documentation for `generate-overview.ts`** (Completed - File Removed)

- **Status:** File has been removed from codebase
- **Note:** Documentation was completed but file no longer exists
- **Date:** January 2025

---

## 📝 Notes

- **Priority levels** are based on business impact and technical risk
- **Effort estimates** are rough guidelines for planning
- **Status updates** should be made as items are completed or priorities change
- **New items** should be added with clear context and business justification

---

---

## 📊 Analysis Summary (January 2025)

### ✅ **Resolved/Outdated Items:**

1. **generate-overview.ts** - File no longer exists, item is outdated
2. **API Architecture Consistency** - Largely resolved, API is consistent
3. **Jira Type Interfaces** - Already implemented

### ⚠️ **Still Relevant (Updated):**

1. **Type Safety** - Some `unknown` types can be improved (reduced scope)
2. **Test Coverage Gaps** - Integration tests still needed
3. **Test Infrastructure** - Coverage thresholds not enforced
4. **Code Documentation** - ADRs and some JSDoc gaps
5. **Performance Optimization** - Still relevant

### 📝 **Key Findings:**

- No `.disabled` files found - `generate-overview.ts` has been completely removed
- API uses Koa (not Express) - Update test documentation accordingly
- Type safety is mostly good, but a few specific `unknown` usages need improvement
- Test infrastructure exists but lacks enforcement thresholds
- Documentation is good but missing ADRs

### 📦 **Unused Code Analysis:**

- See `UNUSED_CODE_ANALYSIS.md` for comprehensive analysis and tool recommendations
- Recommended tools: `ts-prune`, `depcheck`, `knip` for finding unused code
- No automated unused code detection currently configured

---

_Last updated: November 2025 (Analysis completed)_
