/**
 * Tests for parse-common.ts
 *
 * Tests the core label parsing and URL generation utilities used throughout the calculator.
 */

import { describe, it, expect } from "vitest";
import {
  getLabelsWithPrefix,
  translateLabel,
  translateLabelWithoutFallback,
  getJiraLink,
} from "../../src/calculator/parse-common";
import {
  createMockOmegaConfig,
  createMinimalMockOmegaConfig,
} from "../../../../tests/fixtures/config-fixtures";

describe("parse-common", () => {
  describe("getLabelsWithPrefix", () => {
    it("should extract labels with specific prefix", () => {
      const labels = [
        "area:frontend",
        "area:backend",
        "team:team-a",
        "theme:platform",
      ];

      const areaLabels = getLabelsWithPrefix(labels, "area");
      const teamLabels = getLabelsWithPrefix(labels, "team");
      const themeLabels = getLabelsWithPrefix(labels, "theme");

      expect(areaLabels).toEqual(["frontend", "backend"]);
      expect(teamLabels).toEqual(["team-a"]);
      expect(themeLabels).toEqual(["platform"]);
    });

    it("should handle empty labels array", () => {
      const labels: string[] = [];

      const result = getLabelsWithPrefix(labels, "area");

      expect(result).toEqual([]);
    });

    it("should handle labels without the prefix", () => {
      const labels = ["frontend", "backend", "team-a"];

      const result = getLabelsWithPrefix(labels, "area");

      expect(result).toEqual([]);
    });

    it("should handle labels with whitespace", () => {
      const labels = [" area:frontend ", "  area:backend  ", "team:team-a"];

      const result = getLabelsWithPrefix(labels, "area");

      expect(result).toEqual(["frontend", "backend"]);
    });

    it("should handle partial prefix matches", () => {
      const labels = ["area:frontend", "areas:backend", "area-team:hybrid"];

      const result = getLabelsWithPrefix(labels, "area");

      expect(result).toEqual(["frontend"]);
    });

    it("should handle empty prefix", () => {
      const labels = ["area:frontend", "team:team-a"];

      const result = getLabelsWithPrefix(labels, "");

      expect(result).toEqual([]);
    });
  });

  describe("translateLabel", () => {
    const mockConfig = createMockOmegaConfig();

    it("should translate area labels", () => {
      const result = translateLabel("area", "frontend", mockConfig);

      expect(result).toBe("Frontend");
    });

    it("should translate team labels", () => {
      const result = translateLabel("team", "team-a", mockConfig);

      expect(result).toBe("Team Alpha");
    });

    it("should translate theme labels", () => {
      const result = translateLabel("theme", "platform", mockConfig);

      expect(result).toBe("Platform");
    });

    it("should translate initiative labels", () => {
      const result = translateLabel("initiative", "init-1", mockConfig);

      expect(result).toBe("Initiative One");
    });

    it("should return original value when translation not found", () => {
      const result = translateLabel("area", "unknown", mockConfig);

      expect(result).toBe("unknown");
    });

    it("should return original value when label type not found", () => {
      const result = translateLabel("unknown", "frontend", mockConfig);

      expect(result).toBe("frontend");
    });

    it("should handle empty value", () => {
      const result = translateLabel("area", "", mockConfig);

      expect(result).toBe("");
    });

    it("should handle minimal config with no translations", () => {
      const minimalConfig = createMinimalMockOmegaConfig();

      const result = translateLabel("area", "frontend", minimalConfig);

      expect(result).toBe("frontend");
    });
  });

  describe("translateLabelWithoutFallback", () => {
    const mockConfig = createMockOmegaConfig();

    it("should translate area labels", () => {
      const result = translateLabelWithoutFallback(
        "area",
        "frontend",
        mockConfig,
      );

      expect(result).toBe("Frontend");
    });

    it("should return undefined when translation not found", () => {
      const result = translateLabelWithoutFallback(
        "area",
        "unknown",
        mockConfig,
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined when label type not found", () => {
      const result = translateLabelWithoutFallback(
        "unknown",
        "frontend",
        mockConfig,
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined for empty value", () => {
      const result = translateLabelWithoutFallback("area", "", mockConfig);

      expect(result).toBeUndefined();
    });

    it("should handle minimal config with no translations", () => {
      const minimalConfig = createMinimalMockOmegaConfig();

      const result = translateLabelWithoutFallback(
        "area",
        "frontend",
        minimalConfig,
      );

      expect(result).toBeUndefined();
    });
  });

  describe("getJiraLink", () => {
    it("should generate Jira link with valid config", () => {
      const mockConfig = createMockOmegaConfig();

      const result = getJiraLink("TEST-123", mockConfig);

      expect(result).toBe("https://test.atlassian.net/browse/TEST-123");
    });

    it("should handle config without host", () => {
      const mockConfig = createMockOmegaConfig({
        getJiraConfig: () => ({
          connection: {
            host: null,
            user: "test@example.com",
            token: "test-token",
            boardId: 123,
          },
        }),
      });

      const result = getJiraLink("TEST-123", mockConfig);

      expect(result).toBe("https://example.com/browse/TEST-123");
    });

    it("should handle config with host ending in /rest", () => {
      const mockConfig = createMockOmegaConfig({
        getJiraConfig: () => ({
          connection: {
            host: "https://test.atlassian.net/rest",
            user: "test@example.com",
            token: "test-token",
            boardId: 123,
          },
        }),
      });

      const result = getJiraLink("TEST-123", mockConfig);

      expect(result).toBe("https://test.atlassian.net/browse/TEST-123");
    });

    it("should handle null Jira config", () => {
      const mockConfig = createMockOmegaConfig({
        getJiraConfig: () => null,
      });

      const result = getJiraLink("TEST-123", mockConfig);

      expect(result).toBe("https://example.com/browse/TEST-123");
    });

    it("should handle undefined Jira config", () => {
      const mockConfig = createMockOmegaConfig({
        getJiraConfig: () => undefined,
      });

      const result = getJiraLink("TEST-123", mockConfig);

      expect(result).toBe("https://example.com/browse/TEST-123");
    });

    it("should handle empty ticket ID", () => {
      const mockConfig = createMockOmegaConfig();

      const result = getJiraLink("", mockConfig);

      expect(result).toBe("https://test.atlassian.net/browse/");
    });

    it("should handle special characters in ticket ID", () => {
      const mockConfig = createMockOmegaConfig();

      const result = getJiraLink("TEST-123-ABC", mockConfig);

      expect(result).toBe("https://test.atlassian.net/browse/TEST-123-ABC");
    });
  });
});
