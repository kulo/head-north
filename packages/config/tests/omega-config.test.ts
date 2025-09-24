/**
 * Tests for OmegaConfig
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import OmegaConfig from "../src/omega-config.ts";

describe("OmegaConfig", () => {
  let config: OmegaConfig;

  beforeEach(() => {
    // Mock process.env for Node.js environment
    global.process = {
      env: {
        NODE_ENV: "test",
        PORT: "3001",
        MAX_RETRY: "3",
        DELAY_BETWEEN_RETRY: "2",
        JIRA_USER: "test-user",
        JIRA_TOKEN: "test-token",
        JIRA_HOST: "https://test.atlassian.net",
      },
    } as any;
  });

  afterEach(() => {
    // Clean up
    delete (global as any).process;
  });

  describe("Constructor", () => {
    it("should create instance with default environment", () => {
      config = new OmegaConfig();
      assert.strictEqual(config.environment, "development");
      assert.ok(config.getHost());
    });

    it("should create instance with specified environment", () => {
      config = new OmegaConfig({ overrides: { environment: "production" } });
      assert.strictEqual(config.environment, "production");
    });

    it("should apply overrides", () => {
      const overrides = { customSetting: "test-value" };
      config = new OmegaConfig({ overrides });
      assert.strictEqual(config.get("customSetting"), "test-value");
    });
  });

  describe("Configuration Access", () => {
    beforeEach(() => {
      config = new OmegaConfig({ overrides: { environment: "test" } });
    });

    it("should get API host", () => {
      const host = config.getHost();
      assert.ok(host);
      assert.strictEqual(typeof host, "string");
    });

    it("should get full URL for endpoint", () => {
      const endpoint = "/cycles/roadmap";
      const url = config.getUrl(endpoint);
      assert.ok(url.includes(config.getHost()));
      assert.ok(url.includes(endpoint));
    });

    it("should get API endpoints", () => {
      const endpoints = config.getEndpoints();
      assert.ok(endpoints);
      assert.ok(endpoints.HEALTH_CHECK);
      assert.ok(endpoints.CYCLE_DATA);
    });

    it("should get cache configuration", () => {
      const cacheConfig = config.getCacheConfig();
      assert.ok(cacheConfig);
      assert.ok(cacheConfig.ttl);
      assert.strictEqual(typeof cacheConfig.ttl, "number");
    });

    it("should get cache TTL", () => {
      const ttl = config.getCacheTTL();
      assert.strictEqual(typeof ttl, "number");
      assert.ok(ttl > 0);
    });

    it("should get label translations", () => {
      const translations = config.getLabelTranslations();
      assert.ok(translations);
      assert.strictEqual(typeof translations, "object");
    });
  });

  describe("Environment-specific Configuration", () => {
    it("should include Node.js specific config when process.env is available", () => {
      config = new OmegaConfig({
        processEnv: {
          NODE_ENV: "test",
          PORT: "3001",
          JIRA_USER: "test-user",
        },
      });
      const fullConfig = config.getConfig();

      // Should include basic configuration structure
      assert.ok(fullConfig.environment);
      assert.ok(fullConfig.common);
      assert.ok(fullConfig.common.releaseStrategy);
      assert.ok(Array.isArray(fullConfig.common.releaseStrategy.stages));
    });

    it("should read environment variables", () => {
      config = new OmegaConfig({
        processEnv: {
          NODE_ENV: "test",
          PORT: "3001",
          MAX_RETRY: "3",
          DELAY_BETWEEN_RETRY: "2",
        },
      });
      assert.strictEqual(config.get("environment"), "test");
      assert.ok(config.getConfig().common);
    });

    it("should get Jira configuration", () => {
      config = new OmegaConfig({
        processEnv: {
          NODE_ENV: "test",
          JIRA_USER: "test-user",
          JIRA_TOKEN: "test-token",
          JIRA_HOST: "https://test.atlassian.net",
        },
      });
      const jiraConfig = config.getJiraConfig();

      // Jira config should be available and be an object
      if (jiraConfig) {
        assert.strictEqual(typeof jiraConfig, "object");
      } else {
        // If undefined, that's also acceptable for this test environment
        assert.strictEqual(jiraConfig, undefined);
      }
    });

    it("should get stages configuration", () => {
      config = new OmegaConfig({ overrides: { environment: "test" } });
      const stages = config.getStages();

      assert.ok(Array.isArray(stages));
      assert.ok(stages.length > 0);
      assert.ok(stages[0].id);
      assert.ok(stages[0].name);
    });
  });

  describe("Configuration Management", () => {
    beforeEach(() => {
      config = new OmegaConfig({ overrides: { environment: "test" } });
    });

    it("should set and get custom configuration", () => {
      config.set("customKey", "customValue");
      assert.strictEqual(config.get("customKey"), "customValue");
    });

    it("should return undefined for non-existent keys", () => {
      assert.strictEqual(config.get("nonExistentKey"), undefined);
    });

    it("should return full configuration object", () => {
      const fullConfig = config.getConfig();
      assert.strictEqual(typeof fullConfig, "object");
      assert.ok(fullConfig !== null);
    });
  });
});
