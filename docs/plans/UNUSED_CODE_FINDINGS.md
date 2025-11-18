# Unused Code Analysis Findings

**Date:** November 2025  
**Tools Used:** ts-prune, depcheck

---

## 📊 Summary

### **ts-prune Results:**

- **Total unused exports found:** ~100+ exports
- **Most affected packages:**
  - `packages/config` - Many type exports
  - `packages/jira-primitives` - Several utility functions
  - `packages/types` - Many type definitions
  - `packages/utils` - Several utility functions

### **depcheck Results:**

- **Unused dependencies:** 5 (likely false positives)
- **Unused devDependencies:** 5 (likely false positives)
- **Missing dependencies:** 1 (needs investigation)

---

## 🔍 Detailed Findings

### **1. Unused Exports (ts-prune)**

#### **packages/config/src/index.ts**

**Potentially Unused Type Exports:**

- `ProcessEnv`
- `ConfigOverrides`
- `StageCategories`
- `ReleaseStrategy`
- `ItemStatusValues`
- `ItemStatusCategories`
- `ItemStatuses`
- `EnvironmentConfig`
- `Environments`
- `Organisation`
- `ProductStrategy`
- `CommonConfig`
- `PageConfig`
- `FrontendConfig`
- `BackendConfig`
- `OmegaConfigData`
- `URL`
- `ValidationRule`
- `ValidationRules`
- `JiraFields`
- `JiraConnection`
- `JiraStatusMappings`
- `JiraStatusCategories`
- `JiraLimits`
- `JiraConfigData`
- `BackendConfigWithJira`

**Potentially Unused Functions:**

- `createURL` (line 31)
- `getRequiredEnvVar` (from utils.ts)

**Note:** Many of these are type exports that might be used at compile time but not detected by ts-prune. **Manual review required.**

#### **packages/jira-primitives/src/index.ts**

**Potentially Unused Exports:**

- `JiraClient` - Check if used in adapters
- `extractLabelsWithPrefix` - Check usage
- `extractCustomField` - Check usage
- `extractParent` - Check usage
- `extractAssignee` - Check usage
- `extractAllAssignees` - Check usage
- `jiraSprintToCycle` - Check usage
- `mapJiraStatus` - Check usage
- `createJiraUrl` - Check usage
- `validateRequired` - Check usage

**Potentially Unused Types:**

- `JiraSprintsData`
- `JiraSprint`
- `JiraIssue`
- `JiraIssueFields`
- `JiraStatus`
- `JiraUser`
- `JiraRoadmapItemData`
- `JiraRoadmapItemsData`
- `JiraConfig`

**Potentially Unused Functions:**

- `transformToISODateString` (from transformers.ts)
- `validateOneOf` (from validators.ts)
- `validateRange` (from validators.ts)

**Note:** These are likely used in the API adapters. **Manual review required.**

#### **packages/types/src/index.ts**

**Potentially Unused Type Exports:**

- `AreaId`
- `TeamId`
- `PersonId`
- `ProjectId`
- `Area`
- `Team`
- `Person`
- `CycleId`
- `TicketId`
- `ObjectiveId`
- `StageId`
- `RoadmapItemId`
- `CycleItemId`
- `ValidationItemId`
- `CycleState`
- `ISODateString`
- `Cycle`
- `Objective`
- `RoadmapItem`
- `CycleItem`
- `Stage`
- `ValidationItem`
- `CycleData` (formerly `RawCycleData`, unified with old `CycleData`)

**Note:** These are core domain types that are almost certainly used. **ts-prune may have false positives for types.** **Manual review required.**

#### **packages/utils/src/index.ts**

**Potentially Unused Exports:**

- `Either` (type)
- `Left`
- `Right`
- `Maybe`
- `EitherAsync`
- `getSafeErrorMessage`
- `getSafeErrorStack`
- `Logger` (type)
- `createLogger`
- `logger`
- `pipe`
- `compose`
- `compose3`
- `compose4`
- `mapMaybe`
- `chainMaybe`
- `mapEither`

**Note:** These are functional programming utilities that are likely used. **Manual review required.**

---

### **2. Unused Dependencies (depcheck)**

#### **⚠️ Likely False Positives:**

**Root Dependencies:**

- `p-retry` - Used in API services (check `apps/api/src/services/`)
- `purify-ts` - Used extensively (check `packages/utils/src/purify-utils.ts`)
- `ts-pattern` - Used for pattern matching (check usage in codebase)
- `vue` - Core framework (used in `apps/web/`)
- `zod` - Used for validation (check `apps/api/src/middleware/validation.ts`)

**Root DevDependencies:**

- `@types/koa` - Type definitions (used at compile time)
- `@types/koa-router` - Type definitions (used at compile time)
- `@vitest/coverage-v8` - Used in test scripts
- `@vitest/ui` - Used in test scripts
- `vitest` - Test framework (used in all packages)

**Action:** These are likely false positives due to monorepo structure. **Verify manually before removing.**

#### **✅ Needs Investigation:**

**Missing Dependencies:**

- `@omega/config` - Used in `tests/fixtures/config-fixtures.ts` but not in root `package.json`

**Action:**

- The test file is in root `tests/` directory
- `@omega/config` is a workspace package, so it should be available
- This might be a depcheck limitation with workspace packages
- **Recommendation:** Add to root `devDependencies` if tests are run from root, or verify workspace resolution is working

---

## 🎯 Recommended Actions

### **High Priority:**

1. **Verify Type Exports:**
   - Check if type exports in `packages/config` are actually used
   - Many might be internal types that don't need to be exported
   - Consider using `export type` for type-only exports

2. **Investigate Missing Dependency:**
   - Check `tests/fixtures/config-fixtures.ts`
   - Determine if `@omega/config` should be in root dependencies
   - Or move test file to appropriate package

3. **Review Jira Primitives:**
   - Verify if all exported functions from `packages/jira-primitives` are used
   - Check `apps/api/src/adapters/` for usage

### **Medium Priority:**

4. **Review Utility Functions:**
   - Check if `compose3`, `compose4` in `packages/utils` are used
   - Verify `getSafeErrorMessage`, `getSafeErrorStack` usage
   - Check `mapMaybe`, `chainMaybe`, `mapEither` usage

5. **Verify depcheck False Positives:**
   - Manually verify that `p-retry`, `purify-ts`, `ts-pattern`, `vue`, `zod` are actually used
   - Check if they're used in workspace packages (depcheck might not detect this)

### **Low Priority:**

6. **Clean Up Unused Type Exports:**
   - If types are truly unused, remove them
   - Consider if they should be kept for future use or public API

7. **Update depcheck Configuration:**
   - Add more ignore patterns if needed
   - Consider workspace-specific configuration

---

## ⚠️ Important Notes

### **False Positives:**

1. **Type Exports:**
   - ts-prune may not detect type-only usage
   - Types are used at compile time, not runtime
   - Many "unused" types might be used in type annotations

2. **Monorepo Structure:**
   - depcheck may not properly detect dependencies used in workspace packages
   - Dependencies might be used in `apps/*` or `packages/*` but not in root

3. **Dynamic Imports:**
   - Code loaded dynamically won't be detected
   - Runtime-loaded modules might appear unused

4. **Test Files:**
   - Code used only in tests might appear unused
   - Test utilities should be kept even if only used in tests

### **Before Removing:**

1. ✅ **Search codebase** for usage (including tests)
2. ✅ **Check if it's part of public API** (should be kept)
3. ✅ **Verify dynamic/runtime usage**
4. ✅ **Check if used in workspace packages**
5. ✅ **Consider if it's used for type inference**

---

## 🔄 Next Steps

1. **Manual Review:**
   - Go through each finding manually
   - Search codebase for actual usage
   - Check if exports are part of public API

2. **Create Cleanup Tickets:**
   - High priority: Missing dependencies
   - Medium priority: Verify unused exports
   - Low priority: Clean up confirmed unused code

3. **Update Configuration:**
   - Refine `.depcheckrc.json` based on findings
   - Consider adding ts-prune ignore patterns for known false positives

4. **Regular Checks:**
   - Run `npm run analyze:all` regularly
   - Add to CI/CD pipeline
   - Review findings during code reviews

---

## 📝 Configuration Files Created

- ✅ `.depcheckrc.json` - depcheck configuration
- ✅ `package.json` scripts - `analyze:unused`, `analyze:deps`, `analyze:all`

---

_Last updated: November 2025_
