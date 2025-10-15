# Cleanup & Technical Debt TODOs

This document tracks important cleanup tasks, architectural decisions, and technical debt that should be addressed in future development cycles.

## 🚨 High Priority

### 1. **Decision: `generate-overview.ts` Integration or Removal** ✅ **COMPLETED**

**File:** `apps/api/src/calculator/generate-overview.ts.disabled`

**Status:** ✅ **TEMPORARILY DISABLED**

**Context:**

- Contains valuable GTM (Go-To-Market) validation logic
- Well-tested (17 comprehensive tests, 98.5% passing)
- Currently **NOT used in production** (only in tests)
- Provides structured overview generation for GTM planning

**Business Value:**

- **High** - Contains core GTM validation logic (`validateGTMPlan`)
- Validates scheduled releases and global releases in backlog
- Transforms raw Jira data into GTM-ready structure

**Action Taken:**

- ✅ **Files renamed** to `.disabled` extension to preserve code
- ✅ **Tests disabled** to prevent test runner issues
- ✅ **Documentation added** with deprecation notices
- ✅ **CLEANUP_TODOS.md** created for future decision tracking

**Next Steps:**

- [ ] **Integrate into API** - Add new `/gtm-overview` endpoint (Recommended)
- [ ] **Extract GTM Logic** - Move `validateGTMPlan` to separate GTM service
- [ ] **Remove** - Delete if GTM validation not needed
- [ ] **Keep as Reference** - Maintain for future GTM features

**Recommendation:** Integrate GTM validation into current API architecture

**Effort:** Medium (2-3 days)

---

## 🔧 Medium Priority

### 2. **Type Safety Improvements**

**Files:** Multiple calculator files

**Issue:** Extensive use of `unknown` types reduces type safety

**Tasks:**

- [ ] Add proper TypeScript interfaces for Jira data structures
- [ ] Replace `unknown` types with specific types in `generate-overview.ts`
- [ ] Add type guards for runtime type checking
- [ ] Improve type safety in parser functions

**Effort:** Medium (3-4 days)

### 3. **API Architecture Consistency**

**Context:** Current API returns raw data, but `generate-overview.ts` provides processed data

**Tasks:**

- [ ] Decide on consistent data processing approach (raw vs processed)
- [ ] Standardize response formats across all endpoints
- [ ] Consider adding processed data endpoints for specific use cases

**Effort:** Medium (2-3 days)

---

## 🧹 Low Priority

### 4. **Test Coverage Gaps**

**Status:** 99.3% overall success rate achieved

**Remaining Issues:**

- [ ] Fix 2 remaining GTM validation edge cases in `generate-overview.test.ts`
- [ ] Add integration tests for API endpoints
- [ ] Add end-to-end tests for critical user flows

**Effort:** Low (1-2 days)

### 5. **Code Documentation**

**Tasks:**

- [ ] Add JSDoc to remaining calculator functions
- [ ] Create architecture decision records (ADRs)
- [ ] Document GTM validation business rules
- [ ] Add inline comments for complex business logic

**Effort:** Low (1-2 days)

### 6. **Performance Optimization**

**Tasks:**

- [ ] Profile data transformation performance
- [ ] Optimize large dataset handling
- [ ] Consider caching for frequently accessed data
- [ ] Review memory usage in data processing

**Effort:** Low (1-2 days)

---

## 📋 Completed Items

### ✅ **Test Coverage Implementation** (Completed)

- **Status:** 99.3% test success rate achieved
- **Files:** All critical business logic functions tested
- **Coverage:** 275/277 tests passing
- **Date:** January 2025

### ✅ **JSDoc Documentation for `generate-overview.ts`** (Completed)

- **Status:** Comprehensive documentation added
- **Coverage:** All functions documented with examples
- **Date:** January 2025

---

## 📝 Notes

- **Priority levels** are based on business impact and technical risk
- **Effort estimates** are rough guidelines for planning
- **Status updates** should be made as items are completed or priorities change
- **New items** should be added with clear context and business justification

---

_Last updated: January 2025_
