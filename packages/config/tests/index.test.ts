/**
 * Shared Config Tests
 * Unit tests for the shared configuration package
 */

import { OmegaConfig } from "../src/index.ts";
import { describe, it } from "node:test";
import assert from "node:assert";

describe("Shared Config", () => {
  describe("OmegaConfig", () => {
    it("should create instance with default environment", () => {
      const config = new OmegaConfig();
      assert.strictEqual(config.environment, "development");
    });

    it("should create instance with specified environment", () => {
      const config = new OmegaConfig({
        overrides: { environment: "production" },
      });
      assert.strictEqual(config.environment, "production");
    });

    it("should get API host", () => {
      const config = new OmegaConfig();
      const host = config.getHost();
      assert.ok(host);
      assert.strictEqual(typeof host, "string");
    });

    it("should get API endpoints", () => {
      const config = new OmegaConfig();
      const endpoints = config.getEndpoints();
      assert.ok(endpoints);
      assert.ok(endpoints.HEALTH_CHECK);
      assert.ok(endpoints.CYCLE_DATA);
    });

    it("should get full URL for endpoint", () => {
      const config = new OmegaConfig();
      const endpoint = "/cycles/roadmap";
      const url = config.getUrl(endpoint);
      assert.ok(url.includes(config.getHost()));
      assert.ok(url.includes(endpoint));
    });

    it("should get cache configuration", () => {
      const config = new OmegaConfig();
      const cacheConfig = config.getCacheConfig();
      assert.ok(cacheConfig);
      assert.ok(cacheConfig.ttl);
      assert.strictEqual(typeof cacheConfig.ttl, "number");
    });

    it("should get cache TTL", () => {
      const config = new OmegaConfig();
      const ttl = config.getCacheTTL();
      assert.strictEqual(typeof ttl, "number");
      assert.ok(ttl > 0);
    });

    it("should get label translations", () => {
      const config = new OmegaConfig();
      const translations = config.getLabelTranslations();
      assert.ok(translations);
      assert.strictEqual(typeof translations, "object");
    });
  });
});
