# @headnorth/jira-primitives

Reusable utilities for JIRA data extraction and transformation in the Head North project.

## Overview

This package provides pure, focused utilities for working with JIRA data in the Head North ecosystem. It maintains a clear separation between JIRA domain concepts and Head North domain concepts.

## Features

- **Pure JIRA Types**: Clean type definitions for JIRA data structures
- **Extraction Utilities**: Functions to extract specific data from JIRA issues
- **Transformation Utilities**: Functions to transform JIRA data to Head North formats
- **Validation Utilities**: Functions to create validation items for data quality
- **JIRA Client**: Low-level wrapper for JIRA API calls

## Installation

```bash
npm install @headnorth/jira-primitives
```

## Usage

### Types

```typescript
import type {
  JiraIssue,
  JiraSprint,
  JiraStatus,
} from "@headnorth/jira-primitives";
```

### Extractors

```typescript
import {
  extractLabelsWithPrefix,
  extractCustomField,
  extractParent,
  extractAssignee,
} from "@headnorth/jira-primitives";

// Extract labels with specific prefix
const areaLabels = extractLabelsWithPrefix(issue.fields.labels, "area:");
// Returns: ['platform', 'resilience']

// Extract custom field value
const effort = extractCustomField<number>(issue, "customfield_10002");
// Returns: 5 or undefined

// Extract parent issue key
const parentKey = extractParent(issue);
// Returns: 'PROJ-1' or undefined

// Extract assignee information
const assignee = extractAssignee(issue);
// Returns: { id: 'user123', name: 'John Doe' } or null
```

### Transformers

```typescript
import {
  jiraSprintToCycle,
  mapJiraStatus,
  createJiraUrl,
} from "@headnorth/jira-primitives";

// Transform JIRA sprint to Head North cycle
const cycle = jiraSprintToCycle(jiraSprint);
// Returns: { id: '123', name: 'Sprint 1', start: '2024-01-01', ... }

// Map JIRA status to Head North status
const status = mapJiraStatus(jiraStatus, statusMappings, "todo");
// Returns: 'inprogress' or 'todo' (default)

// Create JIRA URL
const url = createJiraUrl("TEST-1", "https://example.atlassian.net");
// Returns: 'https://example.atlassian.net/browse/TEST-1'
```

### Validators

```typescript
import {
  createValidation,
  validateRequired,
  validateOneOf,
} from "@headnorth/jira-primitives";

// Create validation item
const validation = createValidation("TEST-1", "missingArea");
// Returns: { id: 'TEST-1-missingArea', code: 'missingArea', ... }

// Validate required field
const validations = validateRequired(area, "TEST-1", "area");
// Returns: [] if valid, [{ code: 'missingArea', ... }] if invalid

// Validate value is one of allowed values
const validations = validateOneOf(stage, ["s0", "s1", "s2"], "TEST-1", "stage");
// Returns: [] if valid, [{ code: 'invalidStage', ... }] if invalid
```

### JIRA Client

```typescript
import { JiraClient } from "@headnorth/jira-primitives";

const client = new JiraClient(jiraConfig);

// Search for issues
const issues = await client.searchIssues('issuetype = "Story"', [
  "summary",
  "labels",
]);

// Get sprints
const sprints = await client.getSprints(boardId);

// Get specific issue
const issue = await client.getIssue("TEST-1");
```

## API Reference

### Types

- `JiraIssue` - JIRA issue structure
- `JiraSprint` - JIRA sprint structure
- `JiraStatus` - JIRA status structure
- `JiraUser` - JIRA user structure
- `JiraConfig` - JIRA configuration structure

### Extractors

- `extractLabelsWithPrefix(labels, prefix)` - Extract labels with specific prefix
- `extractCustomField<T>(issue, fieldName)` - Extract custom field value
- `extractParent(issue)` - Extract parent issue key
- `extractComponents(issue)` - Extract components (placeholder)
- `extractAssignee(issue)` - Extract assignee information
- `extractAllAssignees(issues)` - Extract unique assignees from issue list
- `extractStageFromName(name)` - Extract stage from issue name
- `extractProjectName(summary)` - Extract project name from summary

### Transformers

- `jiraSprintToCycle(sprint)` - Transform JIRA sprint to Head North cycle
- `mapJiraStatus(status, mappings, default?)` - Map JIRA status to Head North status
- `createJiraUrl(key, host)` - Create JIRA URL for issue
- `transformToISODateString(dateString)` - Transform date to ISO format

### Validators

- `createValidation(itemId, code, status?)` - Create validation item
- `createParameterizedValidation(itemId, code, parameter, status?)` - Create parameterized validation
- `validateRequired(value, itemId, field)` - Validate required field
- `validateOneOf(value, allowed, itemId, field)` - Validate value is in allowed list
- `validateRange(value, min, max, itemId, field)` - Validate numeric range

### JiraClient

- `searchIssues(jql, fields?)` - Search for issues using JQL
- `getSprints(boardId)` - Get all sprints for board
- `getIssue(key)` - Get specific issue by key
- `getIssuesForSprint(sprintId, boardId, fields?)` - Get issues for sprint

## Design Principles

1. **Pure Functions**: All utilities are pure functions with no side effects
2. **Type Safety**: Full TypeScript support with strict typing
3. **Domain Separation**: Clear separation between JIRA and Head North domains
4. **Composability**: Utilities can be combined to build complex transformations
5. **Testability**: All functions are easily testable in isolation

## Testing

```bash
npm test
```

## Contributing

When adding new utilities:

1. Keep functions pure and focused
2. Add comprehensive tests
3. Update this README
4. Follow existing naming conventions
5. Maintain domain separation
