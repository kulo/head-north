/**
 * Logger Tests
 * Basic test stub for the Utils package
 */

import { describe, it, expect } from "vitest";
import { logger } from "../src/logger";

describe("Logger", () => {
  it("should export logger object", () => {
    expect(logger).toBeDefined();
    expect(typeof logger).toBe("object");
  });

  it("should have middleware logger", () => {
    expect(logger.middleware).toBeDefined();
    expect(typeof logger.middleware).toBe("object");
  });

  it("should have api logger", () => {
    expect(logger.api).toBeDefined();
    expect(typeof logger.api).toBe("object");
  });

  it("should have service logger", () => {
    expect(logger.service).toBeDefined();
    expect(typeof logger.service).toBe("object");
  });

  it("should have default logger", () => {
    expect(logger.default).toBeDefined();
    expect(typeof logger.default).toBe("object");
  });

  it("should have logger methods", () => {
    expect(logger.default.info).toBeDefined();
    expect(typeof logger.default.info).toBe("function");
    expect(logger.default.error).toBeDefined();
    expect(typeof logger.default.error).toBe("function");
    expect(logger.default.warn).toBeDefined();
    expect(typeof logger.default.warn).toBe("function");
    expect(logger.default.debug).toBeDefined();
    expect(typeof logger.default.debug).toBe("function");
  });
});
