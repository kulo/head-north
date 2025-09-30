import { describe, it, beforeEach, expect } from "vitest";
import { resolveStatus } from "../../src/calculator/resolve-status.ts";
import type { OmegaConfig } from "@omega/config";

describe("resolveStatus", () => {
  let mockOmegaConfig: OmegaConfig;
  let mockJiraConfig: any;

  beforeEach(() => {
    mockJiraConfig = {
      statusMappings: {
        "1": "todo",
        "2": "inprogress",
        "3": "done",
        "4": "cancelled",
      },
    };

    mockOmegaConfig = {
      getJiraConfig: () => mockJiraConfig,
      getItemStatusValues: () => ({
        TODO: "todo",
        INPROGRESS: "inprogress",
        DONE: "done",
        CANCELLED: "cancelled",
        POSTPONED: "postponed",
      }),
    } as any;
  });

  it("should return mapped status for valid status ID", () => {
    const issueFields = { status: { id: "2" } };
    const sprint = { start: "2024-01-01", end: "2024-01-31" };

    const result = resolveStatus(issueFields, sprint, mockOmegaConfig);

    expect(result).toBe("inprogress");
  });

  it("should return default TODO status for unmapped status ID", () => {
    const issueFields = { status: { id: "999" } };
    const sprint = { start: "2024-01-01", end: "2024-01-31" };

    const result = resolveStatus(issueFields, sprint, mockOmegaConfig);

    expect(result).toBe("todo");
  });

  it("should return postponed status when sprint timing mismatch", () => {
    const issueFields = {
      status: { id: "2" },
      sprint: { startDate: "2024-02-01" },
    };
    const sprint = { start: "2024-01-01", end: "2024-01-31" };

    const result = resolveStatus(issueFields, sprint, mockOmegaConfig);

    expect(result).toBe("postponed");
  });

  it("should handle missing sprint gracefully", () => {
    const issueFields = { status: { id: "2" } };
    const sprint = null;

    const result = resolveStatus(issueFields, sprint, mockOmegaConfig);

    expect(result).toBe("inprogress");
  });

  it("should handle missing issue sprint gracefully", () => {
    const issueFields = { status: { id: "2" } };
    const sprint = { start: "2024-01-01", end: "2024-01-31" };

    const result = resolveStatus(issueFields, sprint, mockOmegaConfig);

    expect(result).toBe("inprogress");
  });
});
