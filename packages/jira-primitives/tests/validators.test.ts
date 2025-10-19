import { describe, it, expect } from "vitest";
import { validateRequired } from "../src/validators";

describe("validators", () => {
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
});
