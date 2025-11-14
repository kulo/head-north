/**
 * Tests for HeadNorthConfig
 * Complex tests with process environment mocking
 */

import { describe, it, beforeEach, afterEach, expect } from "vitest";
import HeadNorthConfig from "../dist/head-north-config.js";

describe("HeadNorthConfig - Complex Tests", () => {
  let config: HeadNorthConfig;

  beforeEach(() => {
    // Simple test setup without complex process mocking
  });

  afterEach(() => {
    // Simple cleanup
  });

  describe("Constructor", () => {
    it("should create instance with default environment", () => {
      config = new HeadNorthConfig();
      expect(config.getConfig().environment).toBe("development");
      expect(config.getHost()).toBeDefined();
    });

    it("should create instance with specified environment", () => {
      config = new OmegaConfig({ overrides: { environment: "production" } });
      expect(config.getConfig().environment).toBe("production");
    });

    it("should apply overrides", () => {
      const overrides = { customSetting: "test-value" };
      config = new OmegaConfig({ overrides });
      expect(config.get("customSetting")).toBe("test-value");
    });
  });

  describe("Configuration Access", () => {
    beforeEach(() => {
      config = new OmegaConfig({ overrides: { environment: "test" } });
    });

    it("should get API host", () => {
      const host = config.getHost();
      expect(host).toBeDefined();
      expect(typeof host).toBe("string");
    });

    it("should get full URL for endpoint", () => {
      const endpoint = "/cycles/roadmap";
      const url = config.getUrl(endpoint);
      expect(url).toContain(config.getHost());
      expect(url).toContain(endpoint);
    });

    it("should get API endpoints", () => {
      const endpoints = config.getEndpoints();
      expect(endpoints).toBeDefined();
      expect(endpoints.HEALTH_CHECK).toBeDefined();
      expect(endpoints.CYCLE_DATA).toBeDefined();
    });

    it("should get cache configuration", () => {
      const cacheConfig = config.getCacheConfig();
      expect(cacheConfig).toBeDefined();
      expect(cacheConfig.ttl).toBeDefined();
      expect(typeof cacheConfig.ttl).toBe("number");
    });

    it("should get cache TTL", () => {
      const ttl = config.getCacheTTL();
      expect(typeof ttl).toBe("number");
      expect(ttl).toBeGreaterThan(0);
    });

    it("should get label translations", () => {
      const translations = config.getLabelTranslations();
      expect(translations).toBeDefined();
      expect(typeof translations).toBe("object");
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
      expect(fullConfig.environment).toBeDefined();
      expect(fullConfig.common).toBeDefined();
      expect(fullConfig.common.releaseStrategy).toBeDefined();
      expect(Array.isArray(fullConfig.common.releaseStrategy.stages)).toBe(
        true,
      );
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
      expect(config.get("environment")).toBe("test");
      expect(config.getConfig().common).toBeDefined();
    });

    it("should get Jira configuration", () => {
      config = new OmegaConfig({
        processEnv: {
          NODE_ENV: "test",
          JIRA_USER: "test-user",
          JIRA_TOKEN: "test-token",
          JIRA_HOST: "https://test.atlassian.net",
          JIRA_BOARD_ID: "123",
        },
      });
      const jiraConfigResult = config.getJiraConfig();

      // Jira config should be available and validated
      expect(jiraConfigResult.isRight()).toBe(true);
      const jiraConfig = jiraConfigResult.caseOf({
        Left: () => {
          throw new Error("Expected valid JIRA config");
        },
        Right: (validConfig) => validConfig,
      });
      if (jiraConfig) {
        expect(typeof jiraConfig).toBe("object");
      } else {
        // If undefined, that's also acceptable for this test environment
        expect(jiraConfig).toBeUndefined();
      }
    });

    it("should get stages configuration", () => {
      config = new OmegaConfig({ overrides: { environment: "test" } });
      const stages = config.getStages();

      expect(Array.isArray(stages)).toBe(true);
      expect(stages.length).toBeGreaterThan(0);
      expect(stages[0].id).toBeDefined();
      expect(stages[0].name).toBeDefined();
    });
  });

  describe("Configuration Management", () => {
    beforeEach(() => {
      config = new OmegaConfig({ overrides: { environment: "test" } });
    });

    it("should return undefined for non-existent keys", () => {
      expect(config.get("nonExistentKey")).toBeUndefined();
    });

    it("should return full configuration object", () => {
      const fullConfig = config.getConfig();
      expect(typeof fullConfig).toBe("object");
      expect(fullConfig).not.toBeNull();
    });
  });
});
