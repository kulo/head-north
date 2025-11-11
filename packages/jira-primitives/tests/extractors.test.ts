import { describe, it, expect } from "vitest";
import {
  extractLabelsWithPrefix,
  extractCustomField,
  extractParent,
  extractAssignee,
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
      expect(result.isJust()).toBe(true);
      expect(result.extract()).toBe(5);
    });

    it("should return Nothing for missing field", () => {
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
      expect(result.isNothing()).toBe(true);
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
      expect(result.isJust()).toBe(true);
      expect(result.extract()).toBe("PROJ-1");
    });

    it("should return Nothing when no parent", () => {
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
      expect(result.isNothing()).toBe(true);
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
      expect(result.isJust()).toBe(true);
      expect(result.extract()).toEqual({
        id: "user123",
        name: "John Doe",
      });
    });

    it("should return Nothing when no assignee", () => {
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
      expect(result.isNothing()).toBe(true);
    });
  });
});
