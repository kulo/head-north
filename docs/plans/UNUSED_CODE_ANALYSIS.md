# Unused Code Analysis & Tool Recommendations

**Date:** November 2025  
**Purpose:** Identify unused code patterns and recommend tools for automated detection

---

## 📊 Current State Analysis

### ✅ **What's Working Well:**

1. **ESLint Configuration:**
   - `@typescript-eslint/no-unused-vars` is configured (warn level)
   - Unused variables are detected at lint time
   - Pattern `^_` allows intentionally unused parameters

2. **TypeScript Configuration:**
   - Strict mode enabled
   - Type checking helps catch some unused code
   - Declaration files are generated

3. **Build Configuration:**
   - Tree shaking enabled in esbuild configs
   - Source maps for debugging

### ⚠️ **Potential Unused Code Areas:**

#### 1. **Unused Exports in Packages**

**Packages to check:**

- `packages/types/src/index.ts` - Re-exports all from `domain-types.ts`
- `packages/utils/src/index.ts` - Re-exports logger and purify-utils
- `packages/config/src/index.ts` - Exports OmegaConfig and types
- `packages/jira-primitives/src/index.ts` - Exports multiple utilities

**Risk:** Some exported functions/types might not be imported anywhere

#### 2. **Unused Type Definitions**

**Files to check:**

- `apps/api/src/types/index.ts` - Re-exports multiple type files
- `apps/web/src/types/index.ts` - Type exports
- Individual type files that might have unused interfaces

#### 3. **Unused Service Functions**

**Potential candidates:**

- Functions in `apps/api/src/controllers/actions/get-cycle-data.ts` (controller now calls adapter directly)
- Helper functions in `apps/web/src/services/`
- Utility functions in `apps/web/src/lib/utils/`

#### 4. **Unused Components**

**Vue components to verify:**

- All components in `apps/web/src/components/` are actually used in routes/other components
- UI components might be unused if not imported

#### 5. **Unused Dependencies**

**Packages to audit:**

- Root `package.json` dependencies
- Individual app/package dependencies
- Dev dependencies that might not be used

#### 6. **Unused Test Files/Fixtures**

- Test fixtures that are no longer referenced
- Old test files that test removed functionality

---

## 🛠️ Recommended Tools

### **1. ts-prune** ⭐ **RECOMMENDED**

**Purpose:** Find unused exports in TypeScript projects

**Installation:**

```bash
npm install -D ts-prune
```

**Usage:**

```bash
# Basic scan
npx ts-prune

# Ignore test files
npx ts-prune --ignore 'tests|test|spec'

# Show progress
npx ts-prune --show-progress

# Include test files
npx ts-prune --include '**/*.test.ts'
```

**Configuration (`ts-prune.json`):**

```json
{
  "ignore": [
    "tests/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/index.ts",
    "**/dist/**"
  ],
  "project": "./tsconfig.json"
}
```

**Pros:**

- ✅ Fast and lightweight
- ✅ Works with TypeScript projects
- ✅ Can ignore patterns
- ✅ Good for finding unused exports

**Cons:**

- ❌ Only finds unused exports (not unused local code)
- ❌ May have false positives with dynamic imports

---

### **2. depcheck** ⭐ **RECOMMENDED**

**Purpose:** Find unused npm dependencies

**Installation:**

```bash
npm install -D depcheck
```

**Usage:**

```bash
# Check root and all workspaces
npx depcheck

# Ignore specific packages
npx depcheck --ignores "@types/*,eslint-*"

# Check specific directory
npx depcheck --json
```

**Configuration (`.depcheckrc.json`):**

```json
{
  "ignoreMatches": [
    "@types/*",
    "eslint-*",
    "@typescript-eslint/*",
    "vue-eslint-parser",
    "webpack-*",
    "@babel/*",
    "@vitest/*"
  ],
  "ignoreDirs": ["dist", "node_modules", "coverage"]
}
```

**Pros:**

- ✅ Finds unused dependencies
- ✅ Finds missing dependencies
- ✅ Works with monorepos
- ✅ Can ignore patterns

**Cons:**

- ❌ May have false positives (dynamically loaded deps)
- ❌ Doesn't check runtime usage

---

### **3. unimport** ⭐ **GOOD FOR VUE PROJECTS**

**Purpose:** Find unused imports and exports (especially good for Vue)

**Installation:**

```bash
npm install -D unimport
```

**Usage:**

```bash
# Scan for unused imports
npx unimport --scan

# Auto-fix unused imports
npx unimport --fix
```

**Pros:**

- ✅ Works well with Vue files
- ✅ Can auto-fix unused imports
- ✅ Fast scanning

**Cons:**

- ❌ Less comprehensive than ts-prune
- ❌ Primarily for imports, not exports

---

### **4. knip** ⭐ **COMPREHENSIVE**

**Purpose:** Find unused files, dependencies, and exports

**Installation:**

```bash
npm install -D knip
```

**Usage:**

```bash
# Run analysis
npx knip

# Include production code only
npx knip --production

# Exclude specific paths
npx knip --exclude '**/*.test.ts'
```

**Configuration (`knip.json`):**

```json
{
  "entry": [
    "apps/api/src/index.ts",
    "apps/web/src/main.ts",
    "apps/web/webpack.config.mjs"
  ],
  "ignore": ["**/*.d.ts", "**/dist/**", "**/coverage/**", "**/node_modules/**"],
  "ignoreDependencies": [
    "@types/*",
    "eslint-*",
    "webpack-*",
    "@babel/*",
    "@vitest/*"
  ]
}
```

**Pros:**

- ✅ Most comprehensive (files, deps, exports)
- ✅ Works with monorepos
- ✅ Can find unused files
- ✅ Good TypeScript support

**Cons:**

- ❌ Slower than specialized tools
- ❌ More complex configuration
- ❌ May have more false positives

---

### **5. eslint-plugin-unused-imports**

**Purpose:** ESLint rule to detect unused imports

**Installation:**

```bash
npm install -D eslint-plugin-unused-imports
```

**Configuration (`eslint.config.js`):**

```javascript
import unusedImports from "eslint-plugin-unused-imports";

export default [
  // ... existing config
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
```

**Pros:**

- ✅ Integrates with existing ESLint setup
- ✅ Can auto-fix unused imports
- ✅ Runs during linting

**Cons:**

- ❌ Only finds unused imports (not exports)
- ❌ Requires ESLint integration

---

## 🎯 Recommended Approach

### **Phase 1: Quick Wins (Low Effort, High Value)**

1. **Install and run `ts-prune`:**

   ```bash
   npm install -D ts-prune
   npm run analyze:unused
   ```

   Add to `package.json`:

   ```json
   {
     "scripts": {
       "analyze:unused": "ts-prune --ignore 'tests|test|spec|dist'"
     }
   }
   ```

2. **Install and run `depcheck`:**
   ```bash
   npm install -D depcheck
   npm run analyze:deps
   ```
   Add to `package.json`:
   ```json
   {
     "scripts": {
       "analyze:deps": "depcheck --ignores '@types/*,eslint-*,webpack-*,@babel/*,@vitest/*'"
     }
   }
   ```

### **Phase 2: Comprehensive Analysis (Medium Effort)**

3. **Install `knip` for comprehensive analysis:**

   ```bash
   npm install -D knip
   npm run analyze:comprehensive
   ```

   Configure for monorepo structure

4. **Add ESLint plugin for ongoing detection:**
   ```bash
   npm install -D eslint-plugin-unused-imports
   ```
   Configure in `eslint.config.js`

### **Phase 3: CI Integration (Ongoing)**

5. **Add to CI/CD pipeline:**
   - Run `ts-prune` and `depcheck` in CI
   - Fail builds if unused code is found (optional)
   - Generate reports

---

## 📋 Specific Areas to Check

### **High Priority:**

1. **Package Exports:**
   - `packages/jira-primitives/src/index.ts` - Check if all exports are used
   - `packages/utils/src/index.ts` - Verify logger and purify-utils usage
   - `packages/config/src/index.ts` - Check type exports

2. **API Types:**
   - `apps/api/src/types/index.ts` - Verify all re-exported types are used
   - `apps/api/src/types/api-response-types.ts` - Check if all interfaces are used

3. **Web Services:**
   - `apps/web/src/services/index.ts` - Verify all exported services are used
   - Individual service files for unused functions

4. **Web Components:**
   - All Vue components in `apps/web/src/components/` - Verify usage
   - UI components might be conditionally used

### **Medium Priority:**

5. **Utility Functions:**
   - `apps/web/src/lib/utils/` - Check individual utility functions
   - `apps/api/src/utils/` - Verify route-registry usage

6. **Constants:**
   - `apps/web/src/lib/constants/` - Check if all constants are used
   - `apps/api/src/constants/` - Verify default values usage

### **Low Priority:**

7. **Test Fixtures:**
   - `apps/api/tests/fixtures/` - Check if all fixtures are used
   - `apps/web/tests/fixtures/` - Verify fixture usage

8. **Type Definitions:**
   - `.d.ts` files - Check if all types are used
   - Interface definitions that might be unused

---

## 🚀 Implementation Steps

### **Step 1: Add Tools to Package.json**

```json
{
  "devDependencies": {
    "ts-prune": "^0.10.3",
    "depcheck": "^1.4.7",
    "knip": "^5.0.0",
    "eslint-plugin-unused-imports": "^4.1.0"
  },
  "scripts": {
    "analyze:unused": "ts-prune --ignore 'tests|test|spec|dist|coverage'",
    "analyze:deps": "depcheck --ignores '@types/*,eslint-*,webpack-*,@babel/*,@vitest/*,vue-eslint-parser'",
    "analyze:comprehensive": "knip",
    "analyze:all": "npm run analyze:unused && npm run analyze:deps && npm run analyze:comprehensive"
  }
}
```

### **Step 2: Create Configuration Files**

**`.depcheckrc.json`:**

```json
{
  "ignoreMatches": [
    "@types/*",
    "eslint-*",
    "@typescript-eslint/*",
    "vue-eslint-parser",
    "webpack-*",
    "html-webpack-plugin",
    "copy-webpack-plugin"
  ],
  "ignoreDirs": [
    "dist",
    "node_modules",
    "coverage",
    "**/dist",
    "**/node_modules"
  ]
}
```

**`knip.json`:**

```json
{
  "entry": [
    "apps/api/src/index.ts",
    "apps/web/src/main.ts",
    "apps/web/webpack.config.mjs"
  ],
  "ignore": ["**/*.d.ts", "**/dist/**", "**/coverage/**", "**/node_modules/**"],
  "ignoreDependencies": [
    "@types/*",
    "eslint-*",
    "webpack-*",
    "@babel/*",
    "@vitest/*"
  ]
}
```

### **Step 3: Run Initial Analysis**

```bash
# Install tools
npm install

# Run analysis
npm run analyze:all

# Review results and create cleanup tickets
```

### **Step 4: Integrate with ESLint (Optional)**

Update `eslint.config.js` to catch unused imports during development.

---

## 📝 Expected Findings

Based on the codebase structure, you might find:

1. **Unused type exports** in package index files
2. **Unused utility functions** in lib/utils
3. **Unused Vue components** (if any)
4. **Unused dependencies** (especially dev dependencies)
5. **Unused test fixtures** or helper functions

---

## ⚠️ Important Notes

1. **False Positives:**
   - Dynamic imports won't be detected
   - Runtime-loaded code might appear unused
   - Type-only imports might be flagged
   - Test files might reference unused code intentionally

2. **Manual Review Required:**
   - Always review findings before deleting
   - Check if code is used in tests
   - Verify dynamic/runtime usage
   - Consider if code is part of public API

3. **Gradual Cleanup:**
   - Don't delete everything at once
   - Create tickets for each finding
   - Test after each cleanup
   - Use version control to track changes

---

## 🔄 Maintenance

### **Regular Checks:**

1. **Weekly:** Run `npm run analyze:unused` during code reviews
2. **Monthly:** Run `npm run analyze:deps` to check dependencies
3. **Quarterly:** Run `npm run analyze:comprehensive` for full audit

### **CI Integration:**

Add to GitHub Actions or CI pipeline:

```yaml
- name: Check for unused code
  run: npm run analyze:unused

- name: Check for unused dependencies
  run: npm run analyze:deps
```

---

## 📚 Additional Resources

- [ts-prune GitHub](https://github.com/nadeesha/ts-prune)
- [depcheck GitHub](https://github.com/depcheck/depcheck)
- [knip GitHub](https://github.com/webpro/knip)
- [unimport GitHub](https://github.com/unjs/unimport)
- [ESLint unused-imports plugin](https://github.com/sweepline/eslint-plugin-unused-imports)

---

_Last updated: November 2025_
