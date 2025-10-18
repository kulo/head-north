import { describe, it, expect } from "vitest";
import {
  extractLabelsWithPrefix,
  extractCustomField,
  extractParent,
  extractAssignee,
  extractStageFromName,
  extractProjectName,
} from "../src/extractors";
import type { JiraIssue } from "../src/types";

describe("extractors", () => {
  describe("extractLabelsWithPrefix", () => {
    it("should extract labels with specific prefix", () => {
      const labels = [
        "area:platform",
        "theme:analytics",
        "team:data-science",
        "other:value",
      ];
      const result = extractLabelsWithPrefix(labels, "area");
      expect(result).toEqual(["platform"]);
    });

    it("should extract multiple labels with same prefix", () => {
      const labels = ["area:platform", "area:resilience", "theme:analytics"];
      const result = extractLabelsWithPrefix(labels, "area");
      expect(result).toEqual(["platform", "resilience"]);
    });

    it("should return empty array when no matching prefix", () => {
      const labels = ["theme:analytics", "team:data-science"];
      const result = extractLabelsWithPrefix(labels, "area");
      expect(result).toEqual([]);
    });

    it("should handle empty labels array", () => {
      const result = extractLabelsWithPrefix([], "area");
      expect(result).toEqual([]);
    });
  });

  describe("extractCustomField", () => {
    it("should extract custom field value", () => {
      const issue: JiraIssue = {
        id: "TEST-1",
        key: "TEST-1",
        fields: {
          summary: "Test issue",
          status: { id: "1", name: "To Do" },
          assignee: null,
          labels: [],
          issuetype: { id: "1", name: "Story", subtask: false },
          customfield_10002: 5,
        },
      };

      const result = extractCustomField<number>(issue, "customfield_10002");
      expect(result).toBe(5);
    });

    it("should return undefined for missing field", () => {
      const issue: JiraIssue = {
        id: "TEST-1",
        key: "TEST-1",
        fields: {
          summary: "Test issue",
          status: { id: "1", name: "To Do" },
          assignee: null,
          labels: [],
          issuetype: { id: "1", name: "Story", subtask: false },
        },
      };

      const result = extractCustomField<number>(issue, "customfield_10002");
      expect(result).toBeUndefined();
    });
  });

  describe("extractParent", () => {
    it("should extract parent issue key", () => {
      const issue: JiraIssue = {
        id: "TEST-1",
        key: "TEST-1",
        fields: {
          summary: "Test issue",
          status: { id: "1", name: "To Do" },
          assignee: null,
          labels: [],
          issuetype: { id: "1", name: "Story", subtask: false },
          parent: {
            id: "PROJ-1",
            key: "PROJ-1",
            fields: {
              summary: "Parent issue",
              status: { id: "1", name: "To Do" },
            },
          },
        },
      };

      const result = extractParent(issue);
      expect(result).toBe("PROJ-1");
    });

    it("should return undefined when no parent", () => {
      const issue: JiraIssue = {
        id: "TEST-1",
        key: "TEST-1",
        fields: {
          summary: "Test issue",
          status: { id: "1", name: "To Do" },
          assignee: null,
          labels: [],
          issuetype: { id: "1", name: "Story", subtask: false },
        },
      };

      const result = extractParent(issue);
      expect(result).toBeUndefined();
    });
  });

  describe("extractAssignee", () => {
    it("should extract assignee information", () => {
      const issue: JiraIssue = {
        id: "TEST-1",
        key: "TEST-1",
        fields: {
          summary: "Test issue",
          status: { id: "1", name: "To Do" },
          assignee: {
            accountId: "user123",
            displayName: "John Doe",
            emailAddress: "john@example.com",
            active: true,
          },
          labels: [],
          issuetype: { id: "1", name: "Story", subtask: false },
        },
      };

      const result = extractAssignee(issue);
      expect(result).toEqual({
        id: "user123",
        name: "John Doe",
      });
    });

    it("should return null when no assignee", () => {
      const issue: JiraIssue = {
        id: "TEST-1",
        key: "TEST-1",
        fields: {
          summary: "Test issue",
          status: { id: "1", name: "To Do" },
          assignee: null,
          labels: [],
          issuetype: { id: "1", name: "Story", subtask: false },
        },
      };

      const result = extractAssignee(issue);
      expect(result).toBeNull();
    });
  });

  describe("extractStageFromName", () => {
    it("should extract stage from issue name", () => {
      const result = extractStageFromName("Feature Implementation (s1)");
      expect(result).toBe("s1");
    });

    it("should extract stage from complex name", () => {
      const result = extractStageFromName(
        "Customer Analytics Dashboard [Platform] (s2)",
      );
      expect(result).toBe("s2");
    });

    it("should return empty string when no stage", () => {
      const result = extractStageFromName("Feature Implementation");
      expect(result).toBe("");
    });

    it("should return empty string for malformed brackets", () => {
      const result = extractStageFromName("Feature (s1");
      expect(result).toBe("");
    });
  });

  describe("extractProjectName", () => {
    it("should extract project name from summary", () => {
      const result = extractProjectName(
        "[Platform] Customer Analytics Dashboard",
      );
      expect(result).toBe("Customer Analytics Dashboard");
    });

    it("should extract project name with multiple brackets", () => {
      const result = extractProjectName(
        "[Platform] Customer Analytics Dashboard [Analytics]",
      );
      expect(result).toBe("Customer Analytics Dashboard");
    });

    it("should return full summary when no brackets", () => {
      const result = extractProjectName("Customer Analytics Dashboard");
      expect(result).toBe("Customer Analytics Dashboard");
    });

    it("should handle empty summary", () => {
      const result = extractProjectName("");
      expect(result).toBe("");
    });
  });
});
