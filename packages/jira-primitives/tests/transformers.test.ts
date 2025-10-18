import { describe, it, expect } from "vitest";
import {
  jiraSprintToCycle,
  mapJiraStatus,
  createJiraUrl,
  transformToISODateString,
} from "../src/transformers";
import type { JiraSprint, JiraStatus } from "../src/types";

describe("transformers", () => {
  describe("jiraSprintToCycle", () => {
    it("should transform JIRA sprint to Omega cycle", () => {
      const sprint: JiraSprint = {
        id: "123",
        name: "Sprint 1",
        state: "active",
        startDate: "2024-01-01",
        endDate: "2024-01-15",
        originBoardId: 1,
        goal: "Complete feature implementation",
      };

      const result = jiraSprintToCycle(sprint);
      expect(result).toEqual({
        id: "123",
        name: "Sprint 1",
        start: "2024-01-01",
        end: "2024-01-15",
        delivery: "2024-01-01",
        state: "active",
      });
    });

    it("should handle numeric sprint ID", () => {
      const sprint: JiraSprint = {
        id: 123,
        name: "Sprint 1",
        state: "closed",
        startDate: "2024-01-01",
        endDate: "2024-01-15",
      };

      const result = jiraSprintToCycle(sprint);
      expect(result.id).toBe("123");
    });
  });

  describe("mapJiraStatus", () => {
    it("should map JIRA status using mappings", () => {
      const status: JiraStatus = {
        id: "10001",
        name: "In Progress",
      };

      const mappings = {
        "10001": "inprogress",
        "10002": "done",
      };

      const result = mapJiraStatus(status, mappings);
      expect(result).toBe("inprogress");
    });

    it("should return default status when no mapping found", () => {
      const status: JiraStatus = {
        id: "99999",
        name: "Unknown Status",
      };

      const mappings = {
        "10001": "inprogress",
      };

      const result = mapJiraStatus(status, mappings, "todo");
      expect(result).toBe("todo");
    });

    it("should use default default status", () => {
      const status: JiraStatus = {
        id: "99999",
        name: "Unknown Status",
      };

      const result = mapJiraStatus(status, {});
      expect(result).toBe("todo");
    });
  });

  describe("createJiraUrl", () => {
    it("should create JIRA URL with host", () => {
      const result = createJiraUrl("TEST-1", "https://example.atlassian.net");
      expect(result).toBe("https://example.atlassian.net/browse/TEST-1");
    });

    it("should handle host with /rest suffix", () => {
      const result = createJiraUrl(
        "TEST-1",
        "https://example.atlassian.net/rest",
      );
      expect(result).toBe("https://example.atlassian.net/browse/TEST-1");
    });

    it("should return fallback URL when no host", () => {
      const result = createJiraUrl("TEST-1", "");
      expect(result).toBe("https://example.com/browse/TEST-1");
    });
  });

  describe("transformToISODateString", () => {
    it("should transform valid date string", () => {
      const result = transformToISODateString("2024-01-15T10:30:00.000Z");
      expect(result).toBe("2024-01-15");
    });

    it("should handle date without time", () => {
      const result = transformToISODateString("2024-01-15");
      expect(result).toBe("2024-01-15");
    });

    it("should return fallback for invalid date", () => {
      const result = transformToISODateString("invalid-date");
      expect(result).toBe("1970-01-01");
    });

    it("should return fallback for empty string", () => {
      const result = transformToISODateString("");
      expect(result).toBe("1970-01-01");
    });
  });
});
