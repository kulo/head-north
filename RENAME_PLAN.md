# Rename Plan: Omega-One → Head North

This document tracks the progress of renaming the project from "omega-one" (or "omega") to "head-north".

## ✅ Completed Items

### Package Names & NPM Scopes

- ✅ All packages use `@headnorth/*` scope
  - `@headnorth/api`
  - `@headnorth/web`
  - `@headnorth/config`
  - `@headnorth/types`
  - `@headnorth/utils`
  - `@headnorth/jira-primitives`
  - `@headnorth/eslint-config`
  - `@headnorth/prettier-config`
  - `@headnorth/test-config`
  - `@headnorth/typescript-config`
  - `@headnorth/build-config`

### Code References

- ✅ All import statements updated to use `@headnorth/*` packages
- ✅ TypeScript path mappings updated
- ✅ Webpack aliases updated
- ✅ Class names updated (e.g., `HeadNorthConfig`)
- ✅ File names updated (e.g., `head-north-config.ts`)

### Documentation

- ✅ README.md updated with "Head North" branding
- ✅ CONTRIBUTING.md updated
- ✅ Package descriptions updated
- ✅ Repository URL updated in package.json

### Configuration Files

- ✅ Root package.json name set to "head-north"
- ✅ All package.json files updated
- ✅ tsconfig.json paths updated

## 🔄 Remaining Tasks

### 1. Update Comments & Documentation

- [x] Update comment in `apps/web/playwright.config.ts` (line 7) - currently mentions "Omega to Head North renaming process"
- [x] Review and update any remaining references to "omega" or "omega-one" in comments

### 2. Directory Structure (External)

- [ ] Note: Parent directory is still `/Users/i525391/dev/prewave/prewave-omega/head-north`
  - This is outside the repository scope but may need manual renaming
  - Consider if this affects any absolute paths or configurations

### 3. Git Branch

- [x] Merged `rename-omega-to-head-north` branch into `main` ✅
  - Branch can now be deleted if desired: `git branch -d rename-omega-to-head-north`
  - Remote branch can be deleted: `git push origin --delete rename-omega-to-head-north`

### 4. Final Verification

- [ ] Search for any remaining "omega" or "omega-one" references (case-insensitive)
- [ ] Verify all tests pass after renaming
- [ ] Check CI/CD pipelines for any hardcoded references
- [ ] Update any external documentation or wikis

## 📝 Notes

- The renaming process is largely complete
- Most code and configuration has been updated
- Remaining items are primarily cleanup tasks (comments, documentation, directory names)
- The workspace path still contains "prewave-omega" but this is outside the repository

## 🔍 Search Commands

To find any remaining references:

```bash
# Search for "omega" (case-insensitive)
grep -ri "omega" . --exclude-dir=node_modules --exclude-dir=dist

# Search for "omega-one" (case-insensitive)
grep -ri "omega-one\|omegaone\|omega_one" . --exclude-dir=node_modules --exclude-dir=dist
```

---

_Last updated: Based on current codebase state_
