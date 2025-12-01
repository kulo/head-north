# Cleanup & Technical Debt TODOs

This document tracks important cleanup tasks, architectural decisions, and technical debt that should be addressed in future development cycles.

## 🔧 Medium Priority

### 1. **Test Coverage Gaps** ✅ **STILL RELEVANT**

**Status:** ✅ **Unit tests are comprehensive** (coverage configured, tests exist)

**Current State (January 2025):**

- ✅ **Test infrastructure:** Vitest configured with coverage reporting across all packages
- ✅ **Unit tests:** Comprehensive unit tests exist (adapters, services, utilities)
- ✅ **Service tests:** API service tests exist (`apps/web/tests/services/api-service.test.ts`)
- ❌ **Missing:** No integration tests for Fastify routes/controllers found
- ❌ **Missing:** No E2E tests for Vue components
- ❌ **Missing:** No integration tests for actual Jira API calls (only mocked)

**Remaining Integration Testing Needs:**

- [ ] **API Integration Tests** - Add tests for Fastify routes and HTTP controllers
- [ ] **Vue Component Tests** - Add integration/E2E tests for UI components
- [ ] **Service Layer Integration** - Add tests for real Jira API interactions (with test credentials)
- [ ] **End-to-End Testing** - Consider Cypress/Playwright for full user workflows

**Effort:** Medium (3-5 days)

### 2. **Test Infrastructure Enhancements** ✅ **STILL RELEVANT**

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

### 3. **Code Documentation** ✅ **PARTIALLY ADDRESSED - STILL RELEVANT**

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

---

## 📝 Notes

- **Priority levels** are based on business impact and technical risk
- **Effort estimates** are rough guidelines for planning
- **Status updates** should be made as items are completed or priorities change
- **New items** should be added with clear context and business justification

---

_Last updated: December 1st, 2025_
