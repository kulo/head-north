import { describe, it, expect } from "vitest";
import {
  createValidation,
  createParameterizedValidation,
  validateRequired,
  validateOneOf,
  validateRange,
} from "../src/validators";

describe("validators", () => {
  describe("createValidation", () => {
    it("should create validation item with error status", () => {
      const result = createValidation("TEST-1", "missingArea");
      expect(result).toEqual({
        id: "TEST-1-missingArea",
        code: "missingArea",
        name: "missingArea",
        status: "error",
        description: "",
      });
    });

    it("should create validation item with warning status", () => {
      const result = createValidation("TEST-1", "missingArea", "warning");
      expect(result).toEqual({
        id: "TEST-1-missingArea",
        code: "missingArea",
        name: "missingArea",
        status: "warning",
        description: "",
      });
    });
  });

  describe("createParameterizedValidation", () => {
    it("should create parameterized validation item", () => {
      const result = createParameterizedValidation(
        "TEST-1",
        "invalidArea",
        "unknown-area",
      );
      expect(result).toEqual({
        id: "TEST-1-invalidArea-unknown-area",
        code: "invalidArea",
        name: "invalidArea:unknown-area",
        status: "error",
        description: "unknown-area",
      });
    });

    it("should create parameterized validation with warning status", () => {
      const result = createParameterizedValidation(
        "TEST-1",
        "invalidArea",
        "unknown-area",
        "warning",
      );
      expect(result).toEqual({
        id: "TEST-1-invalidArea-unknown-area",
        code: "invalidArea",
        name: "invalidArea:unknown-area",
        status: "warning",
        description: "unknown-area",
      });
    });
  });

  describe("validateRequired", () => {
    it("should return validation error for undefined value", () => {
      const result = validateRequired(undefined, "TEST-1", "area");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("missingArea");
    });

    it("should return validation error for null value", () => {
      const result = validateRequired(null, "TEST-1", "area");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("missingArea");
    });

    it("should return validation error for empty string", () => {
      const result = validateRequired("", "TEST-1", "area");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("missingArea");
    });

    it("should return empty array for valid value", () => {
      const result = validateRequired("platform", "TEST-1", "area");
      expect(result).toHaveLength(0);
    });

    it("should capitalize field name in error code", () => {
      const result = validateRequired(undefined, "TEST-1", "theme");
      expect(result[0].code).toBe("missingTheme");
    });
  });

  describe("validateOneOf", () => {
    it("should return validation error for invalid value", () => {
      const allowed = ["platform", "resilience", "sustainability"];
      const result = validateOneOf("unknown", allowed, "TEST-1", "area");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("invalidArea");
      expect(result[0].description).toBe("unknown");
    });

    it("should return empty array for valid value", () => {
      const allowed = ["platform", "resilience", "sustainability"];
      const result = validateOneOf("platform", allowed, "TEST-1", "area");
      expect(result).toHaveLength(0);
    });

    it("should capitalize field name in error code", () => {
      const allowed = ["s0", "s1", "s2", "s3"];
      const result = validateOneOf("invalid", allowed, "TEST-1", "stage");
      expect(result[0].code).toBe("invalidStage");
    });
  });

  describe("validateRange", () => {
    it("should return validation error for value below minimum", () => {
      const result = validateRange(0, 1, 8, "TEST-1", "effort");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("effortOutOfRange");
    });

    it("should return validation error for value above maximum", () => {
      const result = validateRange(10, 1, 8, "TEST-1", "effort");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("effortOutOfRange");
    });

    it("should return empty array for value in range", () => {
      const result = validateRange(5, 1, 8, "TEST-1", "effort");
      expect(result).toHaveLength(0);
    });

    it("should handle boundary values", () => {
      const resultMin = validateRange(1, 1, 8, "TEST-1", "effort");
      const resultMax = validateRange(8, 1, 8, "TEST-1", "effort");

      expect(resultMin).toHaveLength(0);
      expect(resultMax).toHaveLength(0);
    });
  });
});
