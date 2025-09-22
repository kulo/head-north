/**
 * Tests for OmegaConfig
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import OmegaConfig from "../omega-config";

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
      expect(config.environment).toBe("development");
      expect(config.getHost()).toBeDefined();
    });

    it("should create instance with specified environment", () => {
      config = new OmegaConfig("production");
      expect(config.environment).toBe("production");
    });

    it("should apply overrides", () => {
      const overrides = { customSetting: "test-value" };
      config = new OmegaConfig("development", overrides);
      expect(config.get("customSetting")).toBe("test-value");
    });
  });

  describe("Configuration Access", () => {
    beforeEach(() => {
      config = new OmegaConfig("test");
    });

    it("should get API host", () => {
      const host = config.getHost();
      expect(host).toBeDefined();
      expect(typeof host).toBe("string");
    });

    it("should get API host from environment configuration", () => {
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
      expect(endpoints.CYCLE_OVERVIEW).toBeDefined();
      expect(endpoints.CYCLES_ROADMAP).toBeDefined();
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
      config = new OmegaConfig("test");
      const fullConfig = config.getConfig();

      // Should include Node.js specific settings
      expect(fullConfig.port).toBeDefined();
      expect(fullConfig.jiraUser).toBeDefined();
      expect(fullConfig.stages).toBeDefined();
      expect(Array.isArray(fullConfig.stages)).toBe(true);
    });

    it("should read environment variables", () => {
      config = new OmegaConfig("test");
      expect(config.get("port")).toBe("3001");
      expect(config.get("maxRetry")).toBe(3);
      expect(config.get("delayBetweenRetry")).toBe(2);
    });

    it("should get Jira configuration", () => {
      config = new OmegaConfig("test");
      const jiraConfig = config.getJiraConfig();

      expect(jiraConfig.user).toBe("test-user");
      expect(jiraConfig.token).toBe("test-token");
      expect(jiraConfig.host).toBe("https://test.atlassian.net");
      expect(jiraConfig.boardId).toBe(825);
      expect(jiraConfig.fields).toBeDefined();
      expect(jiraConfig.limits).toBeDefined();
    });

    it("should get stages configuration", () => {
      config = new OmegaConfig("test");
      const stages = config.getStages();

      expect(Array.isArray(stages)).toBe(true);
      expect(stages.length).toBeGreaterThan(0);
      expect(stages[0]).toHaveProperty("name");
      expect(stages[0]).toHaveProperty("value");
    });
  });

  describe("Configuration Management", () => {
    beforeEach(() => {
      config = new OmegaConfig("test");
    });

    it("should set and get custom configuration", () => {
      config.set("customKey", "customValue");
      expect(config.get("customKey")).toBe("customValue");
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
