# JIRA Adapters

Adapters for transforming JIRA data into Omega domain objects. Choose the default adapter if your JIRA setup matches the expected structure, or create a custom adapter for specialized requirements.

## Overview

The adapter pattern allows organizations to customize how their JIRA data is transformed into Omega's domain model. The default adapter works with standard JIRA setups, while custom adapters can handle specialized configurations.

## Architecture

```
JIRA Data → Adapter → Omega Domain Objects
```

- **JIRA Data**: Raw data from JIRA API (sprints, issues, etc.)
- **Adapter**: Organization-specific transformation logic
- **Omega Domain**: Standardized business objects (cycles, roadmap items, etc.)

## Interface

All adapters implement the `JiraAdapter` interface:

```typescript
interface JiraAdapter {
  fetchCycleData(): Promise<RawCycleData>;
}
```

## Available Adapters

### DefaultJiraAdapter

The default adapter works with JIRA projects that follow this structure:

- **Issue Types**: Separate "Roadmap Item" and "Release Item" issue types
- **Metadata Storage**: Areas, themes, initiatives stored as labels with prefixes (e.g., `area:frontend`, `theme:performance`)
- **Effort Field**: Effort stored in custom field `customfield_10002`
- **Team Assignment**: Teams stored as labels with `team:` prefix
- **Parent-Child Relationships**: Release items link to roadmap items via parent field

**When to use the Default Adapter:**

- Your JIRA project can be configured to match the above structure
- You have flexibility to adjust your JIRA setup (add issue types, configure labels, etc.)
- You want to get started quickly with minimal custom development

**When to create a Custom Adapter:**

- Your JIRA setup is fixed and cannot be changed
- You use different issue types or field structures
- You have complex business logic that doesn't fit the standard model
- You need specialized data transformations or validations

**Usage:**

```typescript
import { DefaultJiraAdapter } from "./default-jira-adapter";
import { JiraClient } from "@omega/jira-primitives";

const jiraClient = new JiraClient(config.getJiraConfig());
const adapter = new DefaultJiraAdapter(jiraClient, config);
const data = await adapter.fetchCycleData();
```

### FakeDataAdapter

Generates realistic fake data for development:

- No JIRA dependency
- Fast iteration
- Realistic data relationships
- Good for UI development and testing

**Usage:**

```typescript
import { FakeDataAdapter } from "./fake-data-adapter";

const adapter = new FakeDataAdapter(config);
const data = await adapter.fetchCycleData();
```

## Creating a Custom Adapter

If your JIRA setup doesn't match the default adapter's expectations, you can create your own adapter. This is useful when:

- Your JIRA project uses different issue types or field structures
- You have existing JIRA configurations that cannot be changed
- You need specialized business logic or data transformations
- You want to optimize for your specific use case

### When to Create a Custom Adapter

**Consider creating your own adapter if:**

- You use different issue types (e.g., only "Story" instead of "Roadmap Item" + "Release Item")
- Your metadata is stored differently (e.g., in components instead of labels)
- You have custom fields with different names or structures
- You need complex data relationships or transformations
- You want to integrate with other systems beyond JIRA

**Stick with the default adapter if:**

- You can adjust your JIRA project to match the expected structure
- You want to minimize development and maintenance overhead
- Your requirements are straightforward and fit the standard model

### 1. Implement the Interface

```typescript
import type { JiraAdapter } from "./jira-adapter.interface";
import type { RawCycleData } from "@omega/types";

export class MyCompanyJiraAdapter implements JiraAdapter {
  constructor(
    private jiraClient: JiraClient,
    private config: OmegaConfig,
  ) {}

  async fetchCycleData(): Promise<RawCycleData> {
    // Your organization-specific logic here
  }
}
```

### 2. Use JIRA Primitives

Leverage the utilities from `@omega/jira-primitives`:

```typescript
import {
  extractLabelsWithPrefix,
  extractCustomField,
  jiraSprintToCycle,
  mapJiraStatus,
  createValidation,
  validateRequired,
} from "@omega/jira-primitives";

// Extract data using primitives
const areaLabels = extractLabelsWithPrefix(issue.fields.labels, "area:");
const effort = extractCustomField<number>(issue, "customfield_10002");

// Transform using primitives
const cycle = jiraSprintToCycle(sprint);
const status = mapJiraStatus(issue.fields.status, mappings);

// Validate using primitives
const validations = validateRequired(area, issue.key, "area");
```

### 3. Handle Organization-Specific Logic

Different organizations may have different setups:

**Example: MyCompany**

- Only "Story" issue type (no separate roadmap items)
- Areas stored as JIRA components
- Initiatives in custom field
- Effort in "story_points" field

```typescript
export class MyCompanyJiraAdapter implements JiraAdapter {
  async fetchCycleData(): Promise<RawCycleData> {
    // Fetch only stories
    const stories = await this.jiraClient.searchIssues('issuetype = "Story"');

    // Derive roadmap items from epic parents
    const roadmapItems = this.deriveRoadmapItemsFromParents(stories);

    // Extract areas from components
    const areas = this.extractAreasFromComponents(stories);

    // Extract initiatives from custom field
    const initiatives = this.extractInitiativesFromField(stories);

    return {
      cycles: sprints.map(jiraSprintToCycle),
      roadmapItems,
      releaseItems: stories.map(this.transformStoryToReleaseItem),
      areas,
      initiatives,
      // ... other metadata
    };
  }
}
```

### 4. Add to Adapter Factory

Update the factory in `collect-cycle-data.ts`:

```typescript
function createAdapter(omegaConfig: OmegaConfig): JiraAdapter {
  if (omegaConfig.isUsingFakeCycleData()) {
    return new FakeDataAdapter(omegaConfig);
  }

  const jiraClient = new JiraClient(omegaConfig.getJiraConfig()!);

  // Add organization detection logic
  const organization = omegaConfig.get("organization");
  switch (organization) {
    case "mycompany":
      return new MyCompanyJiraAdapter(jiraClient, omegaConfig);
    default:
      return new DefaultJiraAdapter(jiraClient, omegaConfig);
  }
}
```

## Data Flow

1. **Fetch Raw Data**: Use `JiraClient` to fetch sprints, issues, etc.
2. **Transform Entities**: Convert JIRA objects to Omega objects
3. **Extract Metadata**: Build areas, teams, initiatives from data
4. **Apply Validations**: Check data quality and create validation items
5. **Return Complete Data**: Return `RawCycleData` with all entities

## Best Practices

### 1. Use Primitives

Don't reinvent the wheel - use the provided primitives:

```typescript
// ✅ Good
const areaLabels = extractLabelsWithPrefix(labels, "area:");
const effort = extractCustomField<number>(issue, "customfield_10002");

// ❌ Bad
const areaLabels = labels
  .filter((l) => l.startsWith("area:"))
  .map((l) => l.replace("area:", ""));
const effort = (issue.fields as any).customfield_10002;
```

### 2. Handle Missing Data Gracefully

```typescript
// ✅ Good
const effort = extractCustomField<number>(issue, "customfield_10002") || 0;
const validations = validateRequired(area, issue.key, "area");

// ❌ Bad
const effort = extractCustomField<number>(issue, "customfield_10002"); // Could be undefined
```

### 3. Extract Metadata from All Data

```typescript
// ✅ Good - extract from all issues
const allIssues = [...roadmapIssues, ...releaseIssues];
const areas = this.extractAreas(allIssues);

// ❌ Bad - extract from subset
const areas = this.extractAreas(roadmapIssues); // Might miss areas only in release items
```

### 4. Create Meaningful Validations

```typescript
// ✅ Good
const validations = [
  ...validateRequired(area, issue.key, "area"),
  ...validateOneOf(stage, ["s0", "s1", "s2", "s3"], issue.key, "stage"),
];

// ❌ Bad
const validations = []; // No validation
```

### 5. Maintain Data Relationships

```typescript
// ✅ Good
const releaseItem = {
  id: issue.key,
  roadmapItemId: extractParent(issue).orDefault(""), // Links to roadmap item
  cycleId: issue.fields.sprint?.id?.toString(), // Links to cycle
  // ...
};

// ❌ Bad
const releaseItem = {
  id: issue.key,
  // Missing relationships
};
```

## Testing

Create comprehensive tests for your adapter:

```typescript
describe("MyCompanyJiraAdapter", () => {
  it("should transform JIRA data correctly", async () => {
    const mockClient = createMockJiraClient();
    const adapter = new MyCompanyJiraAdapter(mockClient, config);

    const data = await adapter.fetchCycleData();

    expect(data.cycles).toHaveLength(5);
    expect(data.roadmapItems.length).toBeGreaterThan(0);
    expect(data.releaseItems.length).toBeGreaterThan(0);
  });
});
```

## Migration Guide

When migrating from the old parser-based approach:

1. **Identify Data Sources**: What JIRA data does your organization use?
2. **Map Transformations**: How do JIRA concepts map to Omega concepts?
3. **Extract Logic**: Move transformation logic from parsers to adapter
4. **Use Primitives**: Replace custom utilities with primitives
5. **Test Thoroughly**: Ensure data structure matches expectations

## Examples

See the `DefaultJiraAdapter` for a complete reference implementation that handles:

- Separate issue types for roadmap and release items
- Label-based metadata extraction
- Custom field handling
- Validation generation
- Data relationship management
