# @omega/jira-primitives

Reusable utilities for JIRA data extraction and transformation in the Omega project.

## Overview

This package provides pure, focused utilities for working with JIRA data in the Omega ecosystem. It maintains a clear separation between JIRA domain concepts and Omega domain concepts.

## Features

- **Pure JIRA Types**: Clean type definitions for JIRA data structures
- **Extraction Utilities**: Functions to extract specific data from JIRA issues
- **Transformation Utilities**: Functions to transform JIRA data to Omega formats
- **Validation Utilities**: Functions to create validation items for data quality
- **JIRA Client**: Low-level wrapper for JIRA API calls

## Installation

```bash
npm install @omega/jira-primitives
```

## Usage

### Types

```typescript
import type { JiraIssue, JiraSprint, JiraStatus } from "@omega/jira-primitives";
```

### Extractors

```typescript
import {
  extractLabelsWithPrefix,
  extractCustomField,
  extractParent,
  extractAssignee,
} from "@omega/jira-primitives";

// Extract labels with specific prefix
const areaLabels = extractLabelsWithPrefix(issue.fields.labels, "area:");
// Returns: ['platform', 'resilience']

// Extract custom field value (returns Maybe<T>)
const effort = extractCustomField<number>(issue, "customfield_10002").orDefault(
  0,
);
// Returns: 5 or 0 (default)

// Extract parent issue key (returns Maybe<string>)
const parentKey = extractParent(issue).orDefault("");
// Returns: 'PROJ-1' or '' (default)

// Extract assignee information (returns Maybe<Person>)
const assignee = extractAssignee(issue).orDefault({
  id: "",
  name: "",
});
// Returns: { id: 'user123', name: 'John Doe' } or default empty object
```

### Transformers

```typescript
import {
  jiraSprintToCycle,
  mapJiraStatus,
  createJiraUrl,
} from "@omega/jira-primitives";

// Transform JIRA sprint to Omega cycle
const cycle = jiraSprintToCycle(jiraSprint);
// Returns: { id: '123', name: 'Sprint 1', start: '2024-01-01', ... }

// Map JIRA status to Omega status
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
} from "@omega/jira-primitives";

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
import { JiraClient } from "@omega/jira-primitives";

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
- `extractCustomField<T>(issue, fieldName)` - Extract custom field value (returns Maybe<T>)
- `extractParent(issue)` - Extract parent issue key (returns Maybe<string>)
- `extractAssignee(issue)` - Extract assignee information (returns Maybe<Person>)
- `extractAllAssignees(issues)` - Extract unique assignees from issue list

### Transformers

- `jiraSprintToCycle(sprint)` - Transform JIRA sprint to Omega cycle
- `mapJiraStatus(status, mappings, default?)` - Map JIRA status to Omega status
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
3. **Domain Separation**: Clear separation between JIRA and Omega domains
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
