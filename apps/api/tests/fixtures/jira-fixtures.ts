/**
 * Test Fixtures - Jira Data
 *
 * Provides mock Jira data for testing API calculator functions.
 * These fixtures represent realistic Jira issue structures and edge cases.
 */

import type {
  JiraIssue,
  JiraSprint,
  JiraRoadmapItemsData,
} from "../../src/types";

/**
 * Create a mock Jira issue with default values
 */
export function createMockJiraIssue(
  overrides: Partial<JiraIssue> = {},
): JiraIssue {
  return {
    id: "TEST-123",
    key: "TEST-123",
    fields: {
      summary: "Test Feature (s2)",
      status: {
        id: "2",
        name: "In Progress",
        statusCategory: {
          id: 4,
          key: "indeterminate",
          colorName: "yellow",
          name: "In Progress",
        },
      },
      parent: {
        id: "ROADMAP-456",
        key: "ROADMAP-456",
        fields: {
          summary: "Test Roadmap Item",
          status: {
            id: "1",
            name: "To Do",
          },
        },
      },
      sprint: {
        id: 1,
        name: "Sprint 1",
        state: "active" as const,
        startDate: "2024-01-01",
        endDate: "2024-01-14",
        originBoardId: 123,
        goal: "Test sprint goal",
      },
      labels: ["area:frontend", "team:team-a", "theme:platform"],
      issuetype: {
        id: "10001",
        name: "Release Item",
        subtask: false,
      },
      assignee: {
        accountId: "user123",
        displayName: "John Doe",
        emailAddress: "john@example.com",
        avatarUrls: {
          "48x48": "https://example.com/avatar.png",
        },
        active: true,
        timeZone: "UTC",
      },
      reporter: {
        accountId: "reporter123",
        displayName: "Jane Smith",
        emailAddress: "jane@example.com",
        avatarUrls: {
          "48x48": "https://example.com/avatar2.png",
        },
        active: true,
        timeZone: "UTC",
      },
      effort: 2.0,
    },
    summary: "Test Feature (s2)",
    status: "In Progress",
    roadmapItemId: "ROADMAP-456",
    cycleId: "1",
    ...overrides,
  };
}

/**
 * Create a mock Jira issue with missing optional fields
 */
export function createMinimalJiraIssue(
  overrides: Partial<JiraIssue> = {},
): JiraIssue {
  return {
    id: "TEST-456",
    key: "TEST-456",
    fields: {
      summary: "Minimal Feature",
      status: {
        id: "1",
        name: "To Do",
        statusCategory: { id: 2, key: "new", colorName: "blue", name: "To Do" },
      },
      parent: {
        id: "ROADMAP-789",
        key: "ROADMAP-789",
        fields: {
          summary: "Minimal Roadmap Item",
          status: {
            id: "1",
            name: "To Do",
          },
        },
      },
      labels: [],
      issuetype: {
        id: "10001",
        name: "Release Item",
        subtask: false,
      },
      assignee: null,
    },
    summary: "Minimal Feature",
    status: "To Do",
    roadmapItemId: "ROADMAP-789",
    cycleId: "",
    ...overrides,
  };
}

/**
 * Create a mock Jira issue with invalid effort estimate
 */
export function createJiraIssueWithInvalidEffort(): JiraIssue {
  return createMockJiraIssue({
    key: "TEST-INVALID-EFFORT",
    fields: {
      ...createMockJiraIssue().fields,
      effort: 1.3, // Invalid - not divisible by 0.5
    },
  });
}

/**
 * Create a mock Jira issue with missing area label
 */
export function createJiraIssueWithoutAreaLabel(): JiraIssue {
  return createMockJiraIssue({
    key: "TEST-NO-AREA",
    fields: {
      ...createMockJiraIssue().fields,
      labels: ["team:team-a", "theme:platform"], // Missing area label
    },
  });
}

/**
 * Create a mock Jira issue with missing team label
 */
export function createJiraIssueWithoutTeamLabel(): JiraIssue {
  return createMockJiraIssue({
    key: "TEST-NO-TEAM",
    fields: {
      ...createMockJiraIssue().fields,
      labels: ["area:frontend", "theme:platform"], // Missing team label
    },
  });
}

/**
 * Create a mock Jira issue with untranslated team label
 */
export function createJiraIssueWithUntranslatedTeam(): JiraIssue {
  return createMockJiraIssue({
    key: "TEST-UNTRANSLATED-TEAM",
    fields: {
      ...createMockJiraIssue().fields,
      labels: ["area:frontend", "team:unknown-team", "theme:platform"],
    },
  });
}

/**
 * Create a mock Jira issue with no assignee
 */
export function createJiraIssueWithoutAssignee(): JiraIssue {
  return createMockJiraIssue({
    key: "TEST-NO-ASSIGNEE",
    fields: {
      ...createMockJiraIssue().fields,
      assignee: null,
    },
  });
}

/**
 * Create a mock Jira issue with no parent (missing project ID)
 */
export function createJiraIssueWithoutParent(): JiraIssue {
  const baseIssue = createMockJiraIssue();
  const { parent, ...fieldsWithoutParent } = baseIssue.fields;
  const { roadmapItemId, ...issueWithoutRoadmapId } = baseIssue;
  return {
    ...issueWithoutRoadmapId,
    key: "TEST-NO-PARENT",
    fields: fieldsWithoutParent,
  };
}

/**
 * Create a mock Jira issue with different stage
 */
export function createJiraIssueWithStage(stage: string): JiraIssue {
  return createMockJiraIssue({
    key: `TEST-${stage.toUpperCase()}`,
    fields: {
      ...createMockJiraIssue().fields,
      summary: `Test Feature (${stage})`,
    },
    summary: `Test Feature (${stage})`,
  });
}

/**
 * Create a mock Jira sprint
 */
export function createMockJiraSprint(
  overrides: Partial<JiraSprint> = {},
): JiraSprint {
  return {
    id: 1,
    name: "Sprint 1",
    state: "active" as const,
    startDate: "2024-01-01",
    endDate: "2024-01-14",
    originBoardId: 123,
    goal: "Test sprint goal",
    ...overrides,
  };
}

/**
 * Create mock roadmap items data
 */
export function createMockRoadmapItemsData(): JiraRoadmapItemsData {
  return {
    "ROADMAP-456": {
      summary: "Test Roadmap Item",
      labels: [
        "area:frontend",
        "theme:platform",
        "initiative:init-1",
        "no-pre-release-allowed",
      ],
    },
    "ROADMAP-789": {
      summary: "Another Roadmap Item",
      labels: [
        "area:backend",
        "theme:performance",
        "initiative:init-2",
        "no-pre-release-allowed",
      ],
    },
    "ROADMAP-VIRTUAL": {
      summary: "Virtual Roadmap Item",
      labels: ["theme:virtual"],
    },
  };
}

/**
 * Create a collection of test issues for different scenarios
 */
export function createTestIssueCollection(): JiraIssue[] {
  return [
    createMockJiraIssue({ key: "TEST-001" }),
    createMockJiraIssue({
      key: "TEST-002",
      fields: {
        ...createMockJiraIssue().fields,
        status: {
          ...createMockJiraIssue().fields.status,
          id: "3",
          name: "Done",
        },
      },
    }),
    createJiraIssueWithInvalidEffort(),
    createJiraIssueWithoutAreaLabel(),
    createJiraIssueWithoutTeamLabel(),
    createJiraIssueWithUntranslatedTeam(),
    createJiraIssueWithoutAssignee(),
    createJiraIssueWithStage("s1"),
    createJiraIssueWithStage("s3+"),
  ];
}

/**
 * Create mock sprint collection
 */
export function createMockSprintCollection(): JiraSprint[] {
  return [
    createMockJiraSprint({ id: 1, name: "Sprint 1", state: "active" }),
    createMockJiraSprint({ id: 2, name: "Sprint 2", state: "closed" }),
    createMockJiraSprint({ id: 3, name: "Sprint 3", state: "future" }),
  ];
}
