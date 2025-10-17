/**
 * Test Fixtures - OmegaConfig Mock
 *
 * Provides mock OmegaConfig instances for testing without real configuration dependencies.
 * These fixtures ensure consistent test data across all test suites.
 */

import type { OmegaConfig } from "@omega/config";
import { createURL } from "@omega/config/utils";

/**
 * Create a mock OmegaConfig with default test values
 */
export function createMockOmegaConfig(
  overrides: Partial<OmegaConfig> = {},
): OmegaConfig {
  const defaultConfig = {
    getJiraConfig: () => ({
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
      limits: {
        maxResults: 100,
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
      initiatives: {
        "init-1": "Initiative One",
        "init-2": "Initiative Two",
        "init-3": "Initiative Three",
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
      releaseItem: {
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
            "https://docs.example.com/release-item-conventions",
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
        missingInitiativeLabel: {
          label: "Missing initiative label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingInitiativeTranslation: (initiative: string) => ({
          label: `Missing translation for initiative: ${initiative}`,
          reference: createURL(
            "https://docs.example.com/initiative-translations",
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

    getInitiatives: () => ({
      "init-1": "Initiative One",
      "init-2": "Initiative Two",
      "init-3": "Initiative Three",
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

  return { ...defaultConfig, ...overrides } as OmegaConfig;
}

/**
 * Create a mock OmegaConfig with minimal configuration for edge case testing
 */
export function createMinimalMockOmegaConfig(): OmegaConfig {
  return createMockOmegaConfig({
    getJiraConfig: () => null,
    getLabelTranslations: () => ({}),
    getItemStatusValues: () => ({
      TODO: "todo",
      INPROGRESS: "inprogress",
      DONE: "done",
      CANCELLED: "cancelled",
      POSTPONED: "postponed",
    }),
    getValidationDictionary: () => ({
      releaseItem: {
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
            "https://docs.example.com/release-item-conventions",
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
        missingInitiativeLabel: {
          label: "Missing initiative label",
          reference: createURL("https://docs.example.com/labeling-conventions"),
        },
        missingInitiativeTranslation: (initiative: string) => ({
          label: `Missing translation for initiative: ${initiative}`,
          reference: createURL(
            "https://docs.example.com/initiative-translations",
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
 * Create a mock OmegaConfig with custom stage configuration
 */
export function createMockOmegaConfigWithStages(stages: string[]): OmegaConfig {
  return createMockOmegaConfig({
    getStages: () => stages.map((id) => ({ id, name: id })),
    isExternalStage: (stage: string) => stages.includes(stage),
    isReleasableStage: (stage: string) =>
      stages.includes(stage) && stage !== stages[0], // First stage is not releasable
    isFinalReleaseStage: (stage: string) => stage === stages[stages.length - 1], // Last stage is final
  });
}
