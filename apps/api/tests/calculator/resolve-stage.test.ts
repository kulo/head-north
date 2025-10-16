/**
 * Tests for resolve-stage.ts
 *
 * Tests the stage resolution logic for extracting and validating stages from ticket names.
 */

import { describe, it, expect } from "vitest";
import {
  resolveStage,
  isReleasableStage,
  isFinalReleaseStage,
  isExternalStage,
} from "../../src/calculator/resolve-stage";
import {
  createMockOmegaConfig,
  createMockOmegaConfigWithStages,
  createMinimalMockOmegaConfig,
} from "../../../../tests/fixtures/config-fixtures";

describe("resolve-stage", () => {
  describe("resolveStage", () => {
    const mockConfig = createMockOmegaConfig();

    it("should extract stage from ticket name with brackets", () => {
      const result = resolveStage("Feature Implementation (s2)", mockConfig);

      expect(result).toBe("s2");
    });

    it("should extract stage from ticket name with different bracket positions", () => {
      const result1 = resolveStage("(s1) Feature Implementation", mockConfig);
      const result2 = resolveStage("Feature (s3) Implementation", mockConfig);
      const result3 = resolveStage("Feature Implementation (s3+)", mockConfig);

      expect(result1).toBe("s1");
      expect(result2).toBe("s3");
      expect(result3).toBe("s3+");
    });

    it("should return 'internal' for non-external stages", () => {
      const result = resolveStage(
        "Feature Implementation (internal)",
        mockConfig,
      );

      expect(result).toBe("internal");
    });

    it("should return 'internal' for unknown stages", () => {
      const result = resolveStage(
        "Feature Implementation (unknown)",
        mockConfig,
      );

      expect(result).toBe("internal");
    });

    it("should handle empty string", () => {
      const result = resolveStage("", mockConfig);

      expect(result).toBe("internal");
    });

    it("should handle string without brackets", () => {
      const result = resolveStage("Feature Implementation", mockConfig);

      expect(result).toBe("internal");
    });

    it("should handle string with only opening bracket", () => {
      const result = resolveStage("Feature Implementation (s2", mockConfig);

      expect(result).toBe("internal");
    });

    it("should handle string with only closing bracket", () => {
      const result = resolveStage("Feature Implementation s2)", mockConfig);

      expect(result).toBe("internal");
    });

    it("should handle string with multiple bracket pairs", () => {
      const result = resolveStage(
        "Feature (s1) Implementation (s2)",
        mockConfig,
      );

      expect(result).toBe("s2"); // Should use the last bracket pair
    });

    it("should handle case insensitive stage names", () => {
      const result = resolveStage("Feature Implementation (S2)", mockConfig);

      expect(result).toBe("s2");
    });

    it("should handle whitespace in brackets", () => {
      const result = resolveStage("Feature Implementation ( s2 )", mockConfig);

      expect(result).toBe("internal"); // The function doesn't trim whitespace, so " s2 " is not recognized as "s2"
    });

    it("should handle empty brackets", () => {
      const result = resolveStage("Feature Implementation ()", mockConfig);

      expect(result).toBe("internal");
    });

    it("should handle brackets with only whitespace", () => {
      const result = resolveStage("Feature Implementation (   )", mockConfig);

      expect(result).toBe("internal");
    });

    it("should work with custom stage configuration", () => {
      const customConfig = createMockOmegaConfigWithStages([
        "alpha",
        "beta",
        "gamma",
      ]);

      const result1 = resolveStage("Feature (alpha)", customConfig);
      const result2 = resolveStage("Feature (beta)", customConfig);
      const result3 = resolveStage("Feature (unknown)", customConfig);

      expect(result1).toBe("alpha");
      expect(result2).toBe("beta");
      expect(result3).toBe("internal");
    });

    it("should handle minimal config", () => {
      const minimalConfig = createMinimalMockOmegaConfig();

      const result = resolveStage("Feature (s2)", minimalConfig);

      expect(result).toBe("internal");
    });
  });

  describe("isReleasableStage", () => {
    const mockConfig = createMockOmegaConfig();

    it("should return true for releasable stages", () => {
      expect(isReleasableStage("s2", mockConfig)).toBe(true);
      expect(isReleasableStage("s3", mockConfig)).toBe(true);
      expect(isReleasableStage("s3+", mockConfig)).toBe(true);
    });

    it("should return false for non-releasable stages", () => {
      expect(isReleasableStage("s1", mockConfig)).toBe(false);
    });

    it("should return false for unknown stages", () => {
      expect(isReleasableStage("unknown", mockConfig)).toBe(false);
    });

    it("should return false for empty stage", () => {
      expect(isReleasableStage("", mockConfig)).toBe(false);
    });

    it("should work with custom stage configuration", () => {
      const customConfig = createMockOmegaConfigWithStages([
        "alpha",
        "beta",
        "gamma",
      ]);

      expect(isReleasableStage("alpha", customConfig)).toBe(false); // First stage is not releasable
      expect(isReleasableStage("beta", customConfig)).toBe(true); // Middle stages are releasable
      expect(isReleasableStage("gamma", customConfig)).toBe(true); // Last stage is releasable
    });

    it("should handle minimal config", () => {
      const minimalConfig = createMinimalMockOmegaConfig();

      expect(isReleasableStage("s2", minimalConfig)).toBe(false);
    });
  });

  describe("isFinalReleaseStage", () => {
    const mockConfig = createMockOmegaConfig();

    it("should return true for final release stage", () => {
      expect(isFinalReleaseStage("s3+", mockConfig)).toBe(true);
    });

    it("should return false for non-final release stages", () => {
      expect(isFinalReleaseStage("s1", mockConfig)).toBe(false);
      expect(isFinalReleaseStage("s2", mockConfig)).toBe(false);
      expect(isFinalReleaseStage("s3", mockConfig)).toBe(false);
    });

    it("should return false for unknown stages", () => {
      expect(isFinalReleaseStage("unknown", mockConfig)).toBe(false);
    });

    it("should return false for empty stage", () => {
      expect(isFinalReleaseStage("", mockConfig)).toBe(false);
    });

    it("should work with custom stage configuration", () => {
      const customConfig = createMockOmegaConfigWithStages([
        "alpha",
        "beta",
        "gamma",
      ]);

      expect(isFinalReleaseStage("alpha", customConfig)).toBe(false);
      expect(isFinalReleaseStage("beta", customConfig)).toBe(false);
      expect(isFinalReleaseStage("gamma", customConfig)).toBe(true); // s3+ equivalent
    });

    it("should handle minimal config", () => {
      const minimalConfig = createMinimalMockOmegaConfig();

      expect(isFinalReleaseStage("s3+", minimalConfig)).toBe(false);
    });
  });

  describe("isExternalStage", () => {
    const mockConfig = createMockOmegaConfig();

    it("should return true for external stages", () => {
      expect(isExternalStage("s1", mockConfig)).toBe(true);
      expect(isExternalStage("s2", mockConfig)).toBe(true);
      expect(isExternalStage("s3", mockConfig)).toBe(true);
      expect(isExternalStage("s3+", mockConfig)).toBe(true);
    });

    it("should return false for non-external stages", () => {
      expect(isExternalStage("internal", mockConfig)).toBe(false);
      expect(isExternalStage("unknown", mockConfig)).toBe(false);
    });

    it("should return false for empty stage", () => {
      expect(isExternalStage("", mockConfig)).toBe(false);
    });

    it("should work with custom stage configuration", () => {
      const customConfig = createMockOmegaConfigWithStages([
        "alpha",
        "beta",
        "gamma",
      ]);

      expect(isExternalStage("alpha", customConfig)).toBe(true);
      expect(isExternalStage("beta", customConfig)).toBe(true);
      expect(isExternalStage("gamma", customConfig)).toBe(true);
      expect(isExternalStage("unknown", customConfig)).toBe(false);
    });

    it("should handle minimal config", () => {
      const minimalConfig = createMinimalMockOmegaConfig();

      expect(isExternalStage("s1", minimalConfig)).toBe(false);
    });
  });
});
