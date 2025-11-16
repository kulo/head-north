/**
 * Test Fixtures - HeadNorthConfig Mock
 *
 * Provides mock HeadNorthConfig instances for testing without real configuration dependencies.
 * These fixtures ensure consistent test data across all test suites.
 */

import type { HeadNorthConfig } from "@headnorth/config";
import { createURL } from "@headnorth/config";
import { Right } from "@headnorth/utils";

/**
 * Create a mock HeadNorthConfig with default test values
 */
export function createMockHeadNorthConfig(
  overrides: Partial<HeadNorthConfig> = {},
): HeadNorthConfig {
  const defaultConfig = {
    getJiraConfig: () =>
      Right({
        connection: {
          host: "https://test.atlassian.net",
          user: "test@example.com",
          token: "test-token",
          boardId: 123,
        },
        statusMappings: {
          "1": "todo",
          "2": "inprogress",
          "3": "done",
          "4": "cancelled",
          "5": "postponed",
        },
        statusCategories: {
          finished: ["done", "cancelled"],
          active: ["inprogress"],
          future: ["todo"],
        },
        limits: {
          maxResults: 100,
        },
        fields: {
          effort: "customfield_10002",
        },
      }),

    getLabelTranslations: () => ({
      areas: {
        frontend: "Frontend",
        backend: "Backend",
        mobile: "Mobile",
        data: "Data Platform",
      },
      teams: {
        "team-a": "Team Alpha",
        "team-b": "Team Beta",
        "team-c": "Team Charlie",
      },
      themes: {
        platform: "Platform",
        "user-experience": "User Experience",
        performance: "Performance",
        virtual: "Virtual",
      },
      objectives: {
        "obj-1": "Objective One",
        "obj-2": "Objective Two",
        "obj-3": "Objective Three",
      },
    }),

    getItemStatusValues: () => ({
      TODO: "todo",
      INPROGRESS: "inprogress",
      DONE: "done",
      CANCELLED: "cancelled",
      POSTPONED: "postponed",
    }),

    getValidationDictionary: () => ({
      cycleItem: {
        missingEstimate: {
          label: "Missing effort estimate",
          reference: createURL(
            "https://docs.example.com/estimation-conventions",
          ),
        },
        tooGranularEstimate: {
          label: "Effort estimate too granular",
          reference: createURL(
            "https://docs.example.com/estimation-guidelines",
          ),
        },
        noProjectId: {
          label: "No parent project ID",
          reference: createURL(
            "https://docs.example.com/cycle-item-conventions",
          ),
        },
        missingAreaLabel: {
          label: "Missing area label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingTeamLabel: {
          label: "Missing team label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingTeamTranslation: (team: string) => ({
          label: `Missing translation for team: ${team}`,
          reference: createURL("https://docs.example.com/team-translations"),
        }),
        missingAssignee: {
          label: "Missing assignee",
          reference: createURL(
            "https://docs.example.com/assignment-requirements",
          ),
        },
        tooLowStageWithoutProperRoadmapItem: {
          label: "Stage too low without proper roadmap item",
          reference: createURL(
            "https://docs.example.com/roadmap-item-requirements",
          ),
        },
      },
      roadmapItem: {
        missingAreaLabel: {
          label: "Missing area label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingAreaTranslation: (area: string) => ({
          label: `Missing translation for area: ${area}`,
          reference: createURL("https://docs.example.com/area-translations"),
        }),
        missingThemeLabel: {
          label: "Missing theme label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingThemeTranslation: (theme: string) => ({
          label: `Missing translation for theme: ${theme}`,
          reference: createURL("https://docs.example.com/theme-translations"),
        }),
        missingObjectiveLabel: {
          label: "Missing objective label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingObjectiveTranslation: (objective: string) => ({
          label: `Missing translation for objective: ${objective}`,
          reference: createURL(
            "https://docs.example.com/objective-translations",
          ),
        }),
      },
    }),

    getNoPrereleaseAllowedLabel: () => "no-pre-release-allowed",

    getStages: () => [
      { id: "s1", name: "s1" },
      { id: "s2", name: "s2" },
      { id: "s3", name: "s3" },
      { id: "s3+", name: "s3+" },
    ],

    getAreas: () => ({
      frontend: "Frontend",
      backend: "Backend",
      mobile: "Mobile",
      data: "Data Platform",
    }),

    getObjectives: () => ({
      "obj-1": "Objective One",
      "obj-2": "Objective Two",
      "obj-3": "Objective Three",
    }),

    isExternalStage: (stage: string) =>
      ["s1", "s2", "s3", "s3+"].includes(stage),
    isReleasableStage: (stage: string) => ["s2", "s3", "s3+"].includes(stage),
    isFinalReleaseStage: (stage: string) => stage === "s3+",
    isFutureStatus: (status: string) => status === "todo",

    getCacheTTL: () => 300000, // 5 minutes
    getEnvironmentConfig: () => ({
      timeout: 10000,
      retries: 3,
    }),
    getEndpoints: () => ({
      HEALTH_CHECK: "/health",
      CYCLE_DATA: "/cycles/data",
    }),
    getUrl: (endpoint: string) => `https://api.test.com${endpoint}`,
    getHost: () => "https://api.test.com",
  };

  return { ...defaultConfig, ...overrides } as HeadNorthConfig;
}

/**
 * Create a mock HeadNorthConfig with minimal configuration for edge case testing
 */
export function createMinimalMockHeadNorthConfig(): HeadNorthConfig {
  return createMockHeadNorthConfig({
    getJiraConfig: () =>
      Right({
        connection: {
          host: "https://test.atlassian.net",
          user: "test@example.com",
          token: "test-token",
          boardId: 123,
        },
        statusMappings: {},
        statusCategories: {
          finished: [],
          active: [],
          future: [],
        },
        limits: {
          maxResults: 100,
        },
        fields: {
          effort: "customfield_10002",
        },
      }),
    getLabelTranslations: () => ({}),
    getItemStatusValues: () => ({
      TODO: "todo",
      INPROGRESS: "inprogress",
      DONE: "done",
      CANCELLED: "cancelled",
      POSTPONED: "postponed",
    }),
    getValidationDictionary: () => ({
      cycleItem: {
        missingEstimate: {
          label: "Missing effort estimate",
          reference: createURL(
            "https://docs.example.com/estimation-conventions",
          ),
        },
        tooGranularEstimate: {
          label: "Effort estimate too granular",
          reference: createURL(
            "https://docs.example.com/estimation-guidelines",
          ),
        },
        noProjectId: {
          label: "No parent project ID",
          reference: createURL(
            "https://docs.example.com/cycle-item-conventions",
          ),
        },
        missingAreaLabel: {
          label: "Missing area label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingTeamLabel: {
          label: "Missing team label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingTeamTranslation: (team: string) => ({
          label: `Missing translation for team: ${team}`,
          reference: createURL("https://docs.example.com/team-translations"),
        }),
        missingAssignee: {
          label: "Missing assignee",
          reference: createURL(
            "https://docs.example.com/assignment-requirements",
          ),
        },
        tooLowStageWithoutProperRoadmapItem: {
          label: "Stage too low without proper roadmap item",
          reference: createURL(
            "https://docs.example.com/roadmap-item-requirements",
          ),
        },
      },
      roadmapItem: {
        missingAreaLabel: {
          label: "Missing area label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingAreaTranslation: (area: string) => ({
          label: `Missing translation for area: ${area}`,
          reference: createURL("https://docs.example.com/area-translations"),
        }),
        missingThemeLabel: {
          label: "Missing theme label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingThemeTranslation: (theme: string) => ({
          label: `Missing translation for theme: ${theme}`,
          reference: createURL("https://docs.example.com/theme-translations"),
        }),
        missingObjectiveLabel: {
          label: "Missing objective label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingObjectiveTranslation: (objective: string) => ({
          label: `Missing translation for objective: ${objective}`,
          reference: createURL(
            "https://docs.example.com/objective-translations",
          ),
        }),
      },
    }),
    getNoPrereleaseAllowedLabel: () => "no-pre-release-allowed",
    getStages: () => [],
    getAreas: () => ({}),
    isExternalStage: () => false,
    isReleasableStage: () => false,
    isFinalReleaseStage: () => false,
    isFutureStatus: () => false,
  });
}

/**
 * Create a mock HeadNorthConfig with custom stage configuration
 */
export function createMockHeadNorthConfigWithStages(
  stages: string[],
): HeadNorthConfig {
  return createMockHeadNorthConfig({
    getStages: () => stages.map((id) => ({ id, name: id })),
    isExternalStage: (stage: string) => stages.includes(stage),
    isReleasableStage: (stage: string) =>
      stages.includes(stage) && stage !== stages[0], // First stage is not releasable
    isFinalReleaseStage: (stage: string) => stage === stages[stages.length - 1], // Last stage is final
  });
}
