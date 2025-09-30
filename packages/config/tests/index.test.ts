/**
 * Shared Config Tests
 * Unit tests for the shared configuration package
 */

import { OmegaConfig } from "../dist/index.js";
import { describe, it, expect } from "vitest";

describe("Shared Config", () => {
  describe("OmegaConfig", () => {
    it("should create instance with default environment", () => {
      const config = new OmegaConfig();
      expect(config.environment).toBe("development");
    });

    it("should create instance with specified environment", () => {
      const config = new OmegaConfig({
        overrides: { environment: "production" },
      });
      expect(config.environment).toBe("production");
    });

    it("should get API host", () => {
      const config = new OmegaConfig();
      const host = config.getHost();
      expect(host).toBeDefined();
      expect(typeof host).toBe("string");
    });

    it("should get API endpoints", () => {
      const config = new OmegaConfig();
      const endpoints = config.getEndpoints();
      expect(endpoints).toBeDefined();
      expect(endpoints.HEALTH_CHECK).toBeDefined();
      expect(endpoints.CYCLE_DATA).toBeDefined();
    });

    it("should get full URL for endpoint", () => {
      const config = new OmegaConfig();
      const endpoint = "/cycles/roadmap";
      const url = config.getUrl(endpoint);
      expect(url).toContain(config.getHost());
      expect(url).toContain(endpoint);
    });

    it("should get cache configuration", () => {
      const config = new OmegaConfig();
      const cacheConfig = config.getCacheConfig();
      expect(cacheConfig).toBeDefined();
      expect(cacheConfig.ttl).toBeDefined();
      expect(typeof cacheConfig.ttl).toBe("number");
    });

    it("should get cache TTL", () => {
      const config = new OmegaConfig();
      const ttl = config.getCacheTTL();
      expect(typeof ttl).toBe("number");
      expect(ttl).toBeGreaterThan(0);
    });

    it("should get label translations", () => {
      const config = new OmegaConfig();
      const translations = config.getLabelTranslations();
      expect(translations).toBeDefined();
      expect(typeof translations).toBe("object");
    });
  });
});
