import { describe, it, expect } from "vitest";
import {
  hasValidationError,
  getValidationErrorText,
  type RoadmapItemValidations,
} from "../../../src/lib/utils/roadmap-validation";

describe("roadmap-validation utilities", () => {
  describe("hasValidationError", () => {
    it("should return false when validations are undefined", () => {
      expect(hasValidationError(undefined)).toBe(false);
    });

    it("should return false when validations are null", () => {
      expect(hasValidationError(null)).toBe(false);
    });

    it("should return false when all validations pass", () => {
      const validations: RoadmapItemValidations = {
        hasScheduledRelease: true,
        hasGlobalReleaseInBacklog: true,
      };
      expect(hasValidationError(validations)).toBe(false);
    });

    it("should return true when hasScheduledRelease is false", () => {
      const validations: RoadmapItemValidations = {
        hasScheduledRelease: false,
        hasGlobalReleaseInBacklog: true,
      };
      expect(hasValidationError(validations)).toBe(true);
    });

    it("should return true when hasGlobalReleaseInBacklog is false", () => {
      const validations: RoadmapItemValidations = {
        hasScheduledRelease: true,
        hasGlobalReleaseInBacklog: false,
      };
      expect(hasValidationError(validations)).toBe(true);
    });

    it("should return true when both validations fail", () => {
      const validations: RoadmapItemValidations = {
        hasScheduledRelease: false,
        hasGlobalReleaseInBacklog: false,
      };
      expect(hasValidationError(validations)).toBe(true);
    });

    it("should return false when validations object is empty", () => {
      const validations: RoadmapItemValidations = {};
      expect(hasValidationError(validations)).toBe(true); // Both are undefined, so it's an error
    });
  });

  describe("getValidationErrorText", () => {
    it("should return empty string when validations are undefined", () => {
      expect(getValidationErrorText(undefined)).toBe("");
    });

    it("should return empty string when validations are null", () => {
      expect(getValidationErrorText(null)).toBe("");
    });

    it("should return empty string when all validations pass", () => {
      const validations: RoadmapItemValidations = {
        hasScheduledRelease: true,
        hasGlobalReleaseInBacklog: true,
      };
      expect(getValidationErrorText(validations)).toBe("");
    });

    it("should return error for missing scheduled release", () => {
      const validations: RoadmapItemValidations = {
        hasScheduledRelease: false,
        hasGlobalReleaseInBacklog: true,
      };
      expect(getValidationErrorText(validations)).toBe(
        "No scheduled S1/S3 release.",
      );
    });

    it("should return error for missing global release in backlog", () => {
      const validations: RoadmapItemValidations = {
        hasScheduledRelease: true,
        hasGlobalReleaseInBacklog: false,
      };
      expect(getValidationErrorText(validations)).toBe(
        "No planned S3 release.",
      );
    });

    it("should return both errors when both validations fail", () => {
      const validations: RoadmapItemValidations = {
        hasScheduledRelease: false,
        hasGlobalReleaseInBacklog: false,
      };
      const result = getValidationErrorText(validations);
      expect(result).toContain("No scheduled S1/S3 release.");
      expect(result).toContain("No planned S3 release.");
      expect(result.split(" ").length).toBeGreaterThan(2); // Both messages joined
    });
  });
});
