# Head North Modernization Implementation Plan

This document combines the analysis from `MODERNIZATION_ANALYSIS.md` and decisions from `MODERNIZATION_DECISIONS.md` into a comprehensive, actionable implementation plan with Cursor IDE compatibility considerations.

---

## Executive Summary

**Status**: ✅ Decisions Finalized  
**Approach**: Incremental migration in 4 phases  
**Estimated Timeline**: 1-2 weeks  
**Risk Level**: Low-Medium (incremental approach mitigates risk)

---

## Finalized Decisions

### ✅ Decision Log

| Decision                   | Final Choice               | Cursor Compatibility      | Notes                                                           |
| -------------------------- | -------------------------- | ------------------------- | --------------------------------------------------------------- |
| **Monorepo Tool**          | **Turborepo**              | ✅ Good (no known issues) | Nx has MCP integration, but Turborepo is simpler and sufficient |
| **Package Manager**        | **pnpm**                   | ⚠️ Requires setup         | Need shell profile configuration for Cursor terminals           |
| **Package Build Tool**     | **tsup**                   | ✅ Excellent              | No compatibility issues                                         |
| **Linting/Formatting**     | **Keep ESLint + Prettier** | ✅ Excellent              | Standard tools, full Cursor support                             |
| **TypeScript Strict Mode** | **Enable immediately**     | ✅ Excellent              | Better IDE support with strict mode                             |
| **Vite Migration**         | **Full migration**         | ✅ Excellent              | Industry standard, full Cursor support                          |
| **Migration Strategy**     | **Incremental phases**     | ✅ Safe                   | Allows testing at each step                                     |
| **CI/CD Platform**         | **TBD** (No CI/CD found)   | N/A                       | Will need to set up if needed                                   |
| **Rollback Strategy**      | **Feature branch**         | ✅ Standard               | Git workflow, easy rollback                                     |

### 🔄 Reconsidered Decision: Monorepo Tool

**Original Recommendation**: Turborepo  
**Cursor Consideration**: Nx has MCP (Model Context Protocol) server integration with Cursor, providing better IDE intelligence.

**Final Decision**: **Turborepo** (with note about Nx option)

**Rationale**:

- Turborepo is simpler and sufficient for this monorepo size
- No compatibility issues with Cursor
- Nx MCP integration is nice-to-have, not essential
- Can migrate to Nx later if needed without major disruption

**Alternative Consideration**: If advanced IDE features are highly valued, Nx could be chosen instead. The MCP integration provides:

- Better code understanding by Cursor
- Improved dependency graph awareness
- Enhanced task and configuration comprehension

---

## Cursor IDE Compatibility Notes

### ✅ Fully Compatible Tools

- **Vite**: No issues, excellent support
- **tsup**: No known issues
- **ESLint + Prettier**: Standard tools, full Cursor integration
- **TypeScript Strict Mode**: Better IDE support
- **Turborepo**: Works well, no special configuration needed

### ⚠️ Requires Configuration

- **pnpm**: May need shell profile setup for Cursor agent terminals
  - **Solution**: Create `.cursorrc` or configure shell profile
  - **Impact**: Minimal, one-time setup

### 📝 Cursor-Specific Recommendations

1. **TypeScript Project References**: Enable for better IDE performance
2. **Strict Mode**: Improves Cursor's code understanding
3. **ESLint Integration**: Already configured, works great with Cursor
4. **Vite HMR**: Works seamlessly with Cursor's file watching

---

## Implementation Phases

### Phase 1: Quick Wins (1-2 days)

**Goal**: Low-risk improvements that provide immediate value

#### Tasks

1. **Enable TypeScript Strict Mode for Web App**
   - Update `apps/web/tsconfig.json`
   - Fix type errors (use `// @ts-expect-error` with TODOs if needed)
   - **Cursor Impact**: ✅ Better type checking and IDE support

2. **Standardize Module Resolution**
   - Change `moduleResolution: "node"` → `"bundler"` in web tsconfig
   - Update root tsconfig if needed
   - **Cursor Impact**: ✅ Better tree-shaking awareness

3. **Update esbuild Target**
   - Change `target: "node18"` → `"node22"` in `apps/api/esbuild.config.js`
   - **Cursor Impact**: ✅ Aligns with Node version

4. **Remove Unused Babel Config**
   - Delete `apps/web/babel.config.cjs`
   - **Cursor Impact**: ✅ Less confusion, cleaner config

**Success Criteria**:

- ✅ All TypeScript errors resolved
- ✅ Builds still work
- ✅ Tests pass
- ✅ No Cursor IDE issues

**Rollback Plan**: Git revert, restore old tsconfig

---

### Phase 2: Frontend Modernization (2-3 days)

**Goal**: Migrate from Webpack to Vite for 10-100x faster HMR

#### Tasks

1. **Install Vite Dependencies**

   ```bash
   cd apps/web
   pnpm add -D vite @vitejs/plugin-vue
   ```

2. **Create `vite.config.ts`**
   - Configure Vue plugin
   - Set up path aliases
   - Configure proxy for API
   - Set up build options

3. **Update `apps/web/package.json`**
   - Replace webpack scripts with vite
   - Remove webpack dependencies
   - Update dev/build scripts

4. **Update TypeScript Config**
   - Ensure `moduleResolution: "bundler"`
   - Update paths if needed

5. **Update `index.html`**
   - Move to root (Vite convention)
   - Add script tag for entry point

6. **Remove Webpack Config**
   - Delete `webpack.config.mjs`
   - Remove webpack-related dependencies

7. **Test HMR and Build**
   - Verify hot module replacement works
   - Test production build
   - Verify all routes work

**Success Criteria**:

- ✅ Dev server starts with Vite
- ✅ HMR works correctly
- ✅ Production build succeeds
- ✅ All routes functional
- ✅ No console errors
- ✅ Cursor IDE works normally

**Rollback Plan**: Keep webpack config in git history, can restore if needed

**Cursor Compatibility**: ✅ Vite works excellently with Cursor

---

### Phase 3: Monorepo Tooling (2-3 days)

**Goal**: Add pnpm and Turborepo for better performance and caching

#### Task 3.1: Migrate to pnpm (1 day)

1. **Install pnpm**

   ```bash
   npm install -g pnpm
   ```

2. **Configure Cursor for pnpm**
   - Create `.cursorrc` or update shell profile
   - Ensure pnpm is in PATH for Cursor terminals
   - Test: `pnpm --version` in Cursor terminal

3. **Migrate Workspaces**

   ```bash
   # Remove old lockfile and node_modules
   rm -rf package-lock.json node_modules apps/*/node_modules packages/*/node_modules

   # Install with pnpm
   pnpm install
   ```

4. **Update Scripts**
   - Update any npm-specific scripts
   - Test all commands work

5. **Update Documentation**
   - Update README with pnpm commands
   - Update development docs

**Success Criteria**:

- ✅ pnpm install works
- ✅ All scripts work with pnpm
- ✅ Cursor terminals can run pnpm commands
- ✅ No dependency issues

**Rollback Plan**: Restore package-lock.json from git, reinstall with npm

**Cursor Compatibility**: ⚠️ Requires shell profile setup (one-time)

#### Task 3.2: Add Turborepo (1-2 days)

1. **Install Turborepo**

   ```bash
   pnpm add -D turbo
   ```

2. **Create `turbo.json`**

   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["dist/**", ".tsbuildinfo"]
       },
       "test": {
         "dependsOn": ["build"],
         "outputs": ["coverage/**"]
       },
       "lint": {
         "outputs": []
       },
       "type-check": {
         "dependsOn": ["^build"],
         "outputs": []
       },
       "dev": {
         "cache": false,
         "persistent": true
       }
     }
   }
   ```

3. **Update Root `package.json` Scripts**
   - Simplify scripts to use `turbo`
   - Remove `concurrently` dependency
   - Update all task scripts

4. **Configure Caching**
   - Test local caching works
   - Optionally set up remote caching (Vercel or custom)

5. **Update CI/CD** (if applicable)
   - Add Turborepo to CI pipeline
   - Configure remote caching if desired

**Success Criteria**:

- ✅ `pnpm turbo build` works
- ✅ Caching works (second build is faster)
- ✅ All tasks run correctly
- ✅ Scripts are simplified
- ✅ Cursor IDE works normally

**Rollback Plan**: Remove turbo.json, restore old scripts

**Cursor Compatibility**: ✅ No issues, works transparently

---

### Phase 4: Package Build Simplification (1-2 days)

**Goal**: Replace esbuild + tsc with tsup for simpler builds

#### Tasks

1. **Install tsup**

   ```bash
   # In each package directory
   cd packages/types
   pnpm add -D tsup
   ```

2. **Create `tsup.config.ts` for Each Package**

   ```typescript
   import { defineConfig } from "tsup";

   export default defineConfig({
     entry: ["src/index.ts"],
     format: ["esm"],
     dts: true,
     sourcemap: true,
     clean: true,
     splitting: false,
   });
   ```

3. **Update `package.json` Scripts**
   - Replace build script with `tsup`
   - Remove esbuild and tsc build steps

4. **Remove Old Build Configs**
   - Delete `esbuild.config.js`
   - Delete `tsconfig.declaration.json` (if tsup handles it)
   - Keep `tsconfig.json` for type checking

5. **Test Builds**
   - Build each package
   - Verify type declarations generated
   - Test imports from packages

6. **Update Turborepo Pipeline** (if needed)
   - Ensure package builds are cached correctly

**Packages to Migrate**:

- `packages/types`
- `packages/utils`
- `packages/config`
- `packages/jira-primitives`

**Success Criteria**:

- ✅ All packages build with tsup
- ✅ Type declarations generated correctly
- ✅ Imports work from apps
- ✅ Builds are faster
- ✅ Cursor IDE type checking works

**Rollback Plan**: Restore esbuild configs from git

**Cursor Compatibility**: ✅ tsup works excellently with Cursor

---

## Detailed Task Breakdown

### Phase 1: Quick Wins

#### 1.1 Enable TypeScript Strict Mode

**File**: `apps/web/tsconfig.json`

**Changes**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
    // ... other strict options from base config
  }
}
```

**Steps**:

1. Update tsconfig.json
2. Run `pnpm type-check` (or `npm run type-check`)
3. Fix type errors incrementally
4. Use `// @ts-expect-error` with TODO comments for complex fixes
5. Verify build still works

**Estimated Time**: 1-2 hours (depends on number of errors)

---

#### 1.2 Standardize Module Resolution

**File**: `apps/web/tsconfig.json`

**Changes**:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

**Steps**:

1. Update moduleResolution
2. Test type checking
3. Verify build works
4. Check Cursor IDE still works correctly

**Estimated Time**: 15 minutes

---

#### 1.3 Update esbuild Target

**File**: `apps/api/esbuild.config.js`

**Changes**:

```javascript
const config = {
  // ...
  target: "node22", // Changed from node18
  // ...
};
```

**Steps**:

1. Update target
2. Test build
3. Verify API still runs

**Estimated Time**: 5 minutes

---

#### 1.4 Remove Babel Config

**File**: `apps/web/babel.config.cjs`

**Steps**:

1. Delete file
2. Verify no references to it
3. Test build (should still work)

**Estimated Time**: 5 minutes

---

### Phase 2: Vite Migration

#### 2.1 Create Vite Config

**New File**: `apps/web/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@headnorth/types": path.resolve(__dirname, "../../packages/types/src"),
      "@headnorth/utils": path.resolve(__dirname, "../../packages/utils/src"),
      "@headnorth/config": path.resolve(__dirname, "../../packages/config/src"),
    },
  },
  server: {
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "vue-router", "pinia"],
        },
      },
    },
  },
});
```

**Steps**:

1. Create vite.config.ts
2. Install vite and plugin: `pnpm add -D vite @vitejs/plugin-vue`
3. Test config: `pnpm vite --version`

**Estimated Time**: 30 minutes

---

#### 2.2 Update Package.json Scripts

**File**: `apps/web/package.json`

**Changes**:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Steps**:

1. Update scripts
2. Remove webpack-related scripts
3. Test `pnpm dev` works

**Estimated Time**: 15 minutes

---

#### 2.3 Update index.html

**File**: `apps/web/index.html` (move to root if needed)

**Changes**:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Head North</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**Steps**:

1. Ensure index.html is in web root
2. Add script tag for entry point
3. Test dev server

**Estimated Time**: 10 minutes

---

#### 2.4 Remove Webpack

**Steps**:

1. Delete `webpack.config.mjs`
2. Remove webpack dependencies:
   ```bash
   pnpm remove webpack webpack-cli webpack-dev-server \
     vue-loader html-webpack-plugin copy-webpack-plugin \
     css-loader style-loader postcss-loader ts-loader
   ```
3. Remove babel if still present
4. Test build works

**Estimated Time**: 30 minutes

---

#### 2.5 Testing

**Steps**:

1. Start dev server: `pnpm dev`
2. Test HMR (change a file, see it update)
3. Test all routes
4. Build production: `pnpm build`
5. Test production build: `pnpm preview`
6. Verify no console errors

**Estimated Time**: 1 hour

---

### Phase 3: Monorepo Tooling

#### 3.1 pnpm Migration

**Steps**:

1. Install pnpm globally: `npm install -g pnpm`
2. Create `.cursorrc` or update shell profile:
   ```bash
   # Ensure pnpm is in PATH
   export PATH="$HOME/.local/share/pnpm:$PATH"
   ```
3. Remove old files:
   ```bash
   rm -rf package-lock.json node_modules
   rm -rf apps/*/node_modules packages/*/node_modules
   ```
4. Install: `pnpm install`
5. Test: `pnpm run dev`
6. Update docs

**Estimated Time**: 1-2 hours

---

#### 3.2 Turborepo Setup

**Steps**:

1. Install: `pnpm add -D turbo`
2. Create `turbo.json` (see config above)
3. Update root `package.json`:
   ```json
   {
     "scripts": {
       "dev": "turbo run dev",
       "build": "turbo run build",
       "test": "turbo run test",
       "lint": "turbo run lint"
     }
   }
   ```
4. Test: `pnpm turbo build`
5. Verify caching (second build should be faster)
6. Update all package.json files to work with turbo

**Estimated Time**: 2-3 hours

---

### Phase 4: Package Build Simplification

#### 4.1 Migrate Each Package

**For each package** (`types`, `utils`, `config`, `jira-primitives`):

1. Install tsup: `pnpm add -D tsup`
2. Create `tsup.config.ts`:

   ```typescript
   import { defineConfig } from "tsup";

   export default defineConfig({
     entry: ["src/index.ts"],
     format: ["esm"],
     dts: true,
     sourcemap: true,
     clean: true,
   });
   ```

3. Update `package.json`:
   ```json
   {
     "scripts": {
       "build": "tsup"
     }
   }
   ```
4. Remove old build configs
5. Test build

**Estimated Time**: 30 minutes per package (2 hours total)

---

## Testing Strategy

### After Each Phase

1. **Build Test**

   ```bash
   pnpm turbo build
   ```

2. **Type Check**

   ```bash
   pnpm turbo type-check
   ```

3. **Lint**

   ```bash
   pnpm turbo lint
   ```

4. **Test**

   ```bash
   pnpm turbo test
   ```

5. **Dev Server**

   ```bash
   pnpm dev
   ```

   - Verify web app loads
   - Verify API responds
   - Test HMR (if Phase 2 complete)

6. **Cursor IDE Check**
   - Open files in Cursor
   - Verify autocomplete works
   - Check type checking
   - Test go-to-definition

---

## Rollback Procedures

### Phase 1 Rollback

```bash
git checkout HEAD -- apps/web/tsconfig.json
git checkout HEAD -- apps/api/esbuild.config.js
# Restore babel.config.cjs if deleted
```

### Phase 2 Rollback

```bash
git checkout HEAD -- apps/web/
# Restore webpack.config.mjs
pnpm install  # Restore dependencies
```

### Phase 3 Rollback

```bash
# Restore package-lock.json
git checkout HEAD -- package-lock.json
rm -rf pnpm-lock.yaml
npm install
# Remove turbo.json
rm turbo.json
```

### Phase 4 Rollback

```bash
# Restore esbuild configs
git checkout HEAD -- packages/*/esbuild.config.js
# Restore package.json scripts
```

---

## CI/CD Considerations

**Current Status**: No CI/CD configuration found in repository

### If CI/CD is Added Later

1. **For pnpm**:

   ```yaml
   # GitHub Actions example
   - uses: pnpm/action-setup@v2
     with:
       version: 8
   - run: pnpm install
   ```

2. **For Turborepo**:

   ```yaml
   - run: pnpm turbo build
   # Optional: remote caching
   - run: pnpm turbo login
   - run: pnpm turbo link
   ```

3. **For Vite**:
   - Build output in `apps/web/dist`
   - Serve as static files

---

## Success Metrics

### Performance Improvements

- [ ] HMR speed: < 100ms (from Webpack's ~1-2s)
- [ ] Install time: 50% faster with pnpm
- [ ] Build time: 30-50% faster with Turborepo caching
- [ ] Type checking: Faster with proper project references

### Developer Experience

- [ ] Simpler scripts (90+ → ~10-15)
- [ ] Better type safety (strict mode enabled)
- [ ] Faster feedback (HMR, builds)
- [ ] Cursor IDE works perfectly

### Code Quality

- [ ] Consistent TypeScript strictness
- [ ] Unified tooling
- [ ] Modern best practices

---

## Timeline Estimate

| Phase     | Duration      | Dependencies                 |
| --------- | ------------- | ---------------------------- |
| Phase 1   | 1-2 days      | None                         |
| Phase 2   | 2-3 days      | Phase 1 (optional)           |
| Phase 3   | 2-3 days      | None (can do before Phase 2) |
| Phase 4   | 1-2 days      | Phase 3 (needs pnpm)         |
| **Total** | **6-10 days** |                              |

**Note**: Phases can be done in parallel where dependencies allow. Phase 3 can be done before Phase 2.

---

## Next Steps

1. ✅ **Review this plan** - Ensure all decisions are acceptable
2. ✅ **Create feature branch** - `git checkout -b modernization/migrate-to-vite-turborepo`
3. ✅ **Begin Phase 1** - Quick wins (low risk)
4. ✅ **Test thoroughly** - After each phase
5. ✅ **Update documentation** - As you go
6. ✅ **Merge when ready** - After all phases complete and tested

---

## Open Questions Resolved

- ✅ **Monorepo tool**: Turborepo (Nx considered for Cursor MCP, but Turborepo chosen for simplicity)
- ✅ **Package manager**: pnpm (with Cursor shell profile setup)
- ✅ **Package builds**: tsup
- ✅ **Linting**: Keep ESLint + Prettier
- ✅ **TypeScript strict**: Enable immediately
- ✅ **Vite migration**: Full migration
- ✅ **CI/CD**: TBD (none found, will set up if needed)
- ✅ **Remote caching**: Optional (can add later)

---

## Cursor IDE Compatibility Summary

| Tool                  | Compatibility     | Notes                                   |
| --------------------- | ----------------- | --------------------------------------- |
| **Vite**              | ✅ Excellent      | No issues, standard tool                |
| **Turborepo**         | ✅ Excellent      | Works transparently                     |
| **pnpm**              | ⚠️ Requires setup | Need shell profile for Cursor terminals |
| **tsup**              | ✅ Excellent      | No known issues                         |
| **ESLint/Prettier**   | ✅ Excellent      | Standard, full support                  |
| **TypeScript Strict** | ✅ Excellent      | Better IDE support                      |

**Overall**: All recommended tools are compatible with Cursor. Only pnpm requires one-time shell configuration.

---

## References

- [Vite Documentation](https://vitejs.dev/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Documentation](https://pnpm.io/)
- [tsup Documentation](https://tsup.egoist.dev/)
- [Cursor IDE Compatibility](https://cursor.sh/docs)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

**Document Status**: ✅ Ready for Implementation  
**Last Updated**: 2024  
**Next Review**: After Phase 1 completion
