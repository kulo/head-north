<!-- 61d31d7c-65ef-437e-b6de-f0e94cb05a4d b02255aa-ee1b-4a81-81c0-833da7f1eab5 -->

# Rename Roadmap Items to Roadmap Bet

This plan covers renaming "Roadmap Items" to "Roadmap Bet" across the entire codebase, following the same pattern as the previous "Release Items" → "Cycle Items" rename.

## Scope of Changes

### 1. Type Definitions (`packages/types/src/domain-types.ts`)

- Rename `RoadmapItem` interface → `RoadmapBet`
- Rename `RoadmapItemId` type → `RoadmapBetId`
- Update all property references: `roadmapItems` → `roadmapBets`, `roadmapItemId` → `roadmapBetId`
- Update comments mentioning "roadmap item" → "roadmap bet"

### 2. File Renames

- `apps/web/src/lib/utils/roadmap-item-utils.ts` → `roadmap-bet-utils.ts`
- `apps/web/tests/lib/utils/roadmap-item-utils.test.ts` → `roadmap-bet-utils.test.ts`
- `apps/web/src/components/roadmap/RoadmapItemOverview.vue` → `RoadmapBetOverview.vue`
- `apps/web/src/components/cycles/RoadmapItemListItem.vue` → `RoadmapBetListItem.vue`

### 3. Component Names and Props

- Update Vue component names: `roadmap-item-overview` → `roadmap-bet-overview`
- Update prop names: `roadmapItem` → `roadmapBet`, `roadmapItems` → `roadmapBets`
- Update component references in parent components

### 4. Variable and Function Names

- All `roadmapItem` variables → `roadmapBet`
- All `roadmapItems` variables → `roadmapBets`
- All `roadmapItemId` → `roadmapBetId`
- Function names like `filterRoadmapItem` → `filterRoadmapBet`
- Function names like `roadmapItemMatchesArea` → `roadmapBetMatchesArea`

### 5. CSS Classes

- `.roadmap-item` → `.roadmap-bet`
- `.roadmap-item-row` → `.roadmap-bet-row`
- `.roadmap-item-name` → `.roadmap-bet-name`
- `.roadmap-item-owner` → `.roadmap-bet-owner`
- `.roadmap-item-progress` → `.roadmap-bet-progress`
- Update all CSS selectors in `apps/web/src/assets/css/style.css`

### 6. JIRA Adapter References

- `apps/api/src/adapters/default-jira-adapter.ts`: Update JIRA query from `'issuetype = "Roadmap Item"'` → `'issuetype = "Roadmap Bet"'`
- Update comments and documentation mentioning "Roadmap Item" issue type

### 7. Validation Dictionary

- `packages/config/src/validation-dictionary.ts`: Update all validation messages mentioning "Roadmap Item" → "Roadmap Bet"
- Update validation keys: `roadmapItem` → `roadmapBet`

### 8. API Middleware

- `apps/api/src/middleware/validation.ts`: Update schema names `roadmapItemSchema` → `roadmapBetSchema`
- Update property names in validation schemas

### 9. Documentation

- `README.md`: Update all references to "Roadmap Items" → "Roadmap Bet"
- Update mermaid diagram labels
- Update section headers and descriptions
- `apps/api/src/adapters/README.md`: Update references

### 10. Test Files and Fixtures

- Update all test files to use new naming
- Update mock data generators
- Update test descriptions and variable names
- Update fixture files

### 11. Comments and Documentation Strings

- Update all code comments mentioning "roadmap item" → "roadmap bet"
- Update JSDoc comments
- Update function documentation

## Key Files to Modify

1. `packages/types/src/domain-types.ts` - Core type definitions
2. `apps/api/src/adapters/default-jira-adapter.ts` - JIRA issue type query
3. `apps/web/src/lib/utils/filter.ts` - Filtering logic
4. `apps/web/src/lib/utils/roadmap-item-utils.ts` - Utility functions (rename file)
5. `apps/web/src/components/roadmap/RoadmapItemOverview.vue` - Component (rename file)
6. `apps/web/src/components/cycles/RoadmapItemListItem.vue` - Component (rename file)
7. `apps/web/src/assets/css/style.css` - CSS classes
8. `packages/config/src/validation-dictionary.ts` - Validation messages
9. `README.md` - Documentation
10. All test files and fixtures

## Implementation Strategy

1. Start with type definitions to establish the new naming
2. Rename files (using git mv to preserve history)
3. Update imports and exports
4. Update variable names and function names
5. Update component names and props
6. Update CSS classes
7. Update documentation
8. Update JIRA adapter queries
9. Update validation messages
10. Update all test files

This is a comprehensive refactoring that touches many files but follows a clear pattern from the previous rename.

### To-dos

- [ ] Update type definitions in packages/types/src/domain-types.ts: RoadmapItem → RoadmapBet, RoadmapItemId → RoadmapBetId, and all property references
- [ ] Rename roadmap-item-utils.ts files to roadmap-bet-utils.ts and update all imports
- [ ] Rename RoadmapItemOverview.vue and RoadmapItemListItem.vue to RoadmapBetOverview.vue and RoadmapBetListItem.vue
- [ ] Update all variable names: roadmapItem → roadmapBet, roadmapItems → roadmapBets, roadmapItemId → roadmapBetId throughout codebase
- [ ] Update function names: filterRoadmapItem → filterRoadmapBet, roadmapItemMatchesArea → roadmapBetMatchesArea, etc.
- [ ] Update CSS classes in style.css: .roadmap-item → .roadmap-bet and all related selectors
- [ ] Update JIRA adapter to query 'Roadmap Bet' instead of 'Roadmap Item' issue type
- [ ] Update validation dictionary messages and keys to use Roadmap Bet terminology
- [ ] Update API middleware validation schemas to use roadmapBet naming
- [ ] Update README.md and all documentation to use Roadmap Bet terminology
- [ ] Update all test files, fixtures, and mock data to use new naming conventions
