/**
 * Tests for HeadNorthConfig
 * Complex tests with process environment mocking
 */

import { describe, it, beforeEach, afterEach, expect } from "vitest";
import HeadNorthConfig from "../dist/index.js";

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
      config = new HeadNorthConfig({
        overrides: { environment: "production" },
      });
      expect(config.getConfig().environment).toBe("production");
    });

    it("should apply overrides", () => {
      const overrides = { customSetting: "test-value" };
      config = new HeadNorthConfig({ overrides });
      expect(config.get("customSetting")).toBe("test-value");
    });
  });

  describe("Configuration Access", () => {
    beforeEach(() => {
      config = new HeadNorthConfig({ overrides: { environment: "test" } });
    });

    it("should get API host", () => {
      const host = config.getHost();
      expect(host).toBeDefined();
      expect(typeof host).toBe("string");
      // Should be a valid URL format
      expect(host).toMatch(/^https?:\/\/.+/);
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

  describe("Backend Host and Port Configuration", () => {
    it("should combine host and port into URL", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "localhost",
          HN_PORT: "3001",
        },
      });
      const host = config.getHost();
      expect(host).toBe("http://localhost:3001");
    });

    it("should use default host and port when not provided", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
        },
      });
      const host = config.getHost();
      expect(host).toBe("http://localhost:3000");
    });

    it("should use custom host and port from environment variables", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "api.example.com",
          HN_PORT: "8080",
        },
      });
      const host = config.getHost();
      expect(host).toBe("https://api.example.com:8080");
    });

    it("should use https for non-localhost hosts", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "api.production.com",
          HN_PORT: "443",
        },
      });
      const host = config.getHost();
      expect(host).toBe("https://api.production.com:443");
    });

    it("should use http for localhost", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "localhost",
          HN_PORT: "3000",
        },
      });
      const host = config.getHost();
      expect(host).toBe("http://localhost:3000");
    });

    it("should use http for 127.0.0.1", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "127.0.0.1",
          HN_PORT: "3000",
        },
      });
      const host = config.getHost();
      expect(host).toBe("http://127.0.0.1:3000");
    });

    it("should get port as number", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_PORT: "3001",
        },
      });
      const port = config.getPort();
      expect(port).toBe(3001);
      expect(typeof port).toBe("number");
    });

    it("should parse string port to number", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_PORT: "8080",
        },
      });
      const port = config.getPort();
      expect(port).toBe(8080);
    });

    it("should use default port 3000 when not provided", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
        },
      });
      const port = config.getPort();
      expect(port).toBe(3000);
    });

    it("should prefer legacy API_HOST environment variable", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          API_HOST: "https://legacy.example.com:9000",
          HN_HOST: "localhost",
          HN_PORT: "3000",
        },
      });
      const host = config.getHost();
      // Should use legacy API_HOST instead of combining HN_HOST and HN_PORT
      expect(host).toBe("https://legacy.example.com:9000");
    });

    it("should prefer legacy REACT_APP_API_HOST environment variable", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          REACT_APP_API_HOST: "https://react.example.com:8000",
          HN_HOST: "localhost",
          HN_PORT: "3000",
        },
      });
      const host = config.getHost();
      // Should use legacy REACT_APP_API_HOST instead of combining HN_HOST and HN_PORT
      expect(host).toBe("https://react.example.com:8000");
    });

    it("should handle empty host by defaulting to localhost", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "",
          HN_PORT: "3001",
        },
      });
      const host = config.getHost();
      expect(host).toBe("http://localhost:3001");
    });

    it("should handle host with subdomain correctly", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "api.staging.example.com",
          HN_PORT: "8080",
        },
      });
      const host = config.getHost();
      expect(host).toBe("https://api.staging.example.com:8080");
    });

    it("should handle IP address hosts correctly", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "192.168.1.100",
          HN_PORT: "3000",
        },
      });
      const host = config.getHost();
      expect(host).toBe("https://192.168.1.100:3000");
    });

    it("should handle 127.0.0.1 variants correctly", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "127.0.0.1",
          HN_PORT: "3000",
        },
      });
      const host = config.getHost();
      expect(host).toBe("http://127.0.0.1:3000");
    });

    it("should return URL type from getHost()", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "localhost",
          HN_PORT: "3000",
        },
      });
      const host = config.getHost();
      // Verify it's a string (URL is a branded string type)
      expect(typeof host).toBe("string");
      // Verify it's a valid URL format
      expect(host).toMatch(/^https?:\/\/.+/);
      // Verify it includes host and port
      expect(host).toContain("localhost");
      expect(host).toContain("3000");
    });

    it("should handle large port numbers", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "localhost",
          HN_PORT: "65535",
        },
      });
      const host = config.getHost();
      expect(host).toBe("http://localhost:65535");
      const port = config.getPort();
      expect(port).toBe(65535);
    });

    it("should handle port 80 correctly", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "example.com",
          HN_PORT: "80",
        },
      });
      const host = config.getHost();
      expect(host).toBe("https://example.com:80");
    });

    it("should handle port 443 correctly", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_HOST: "example.com",
          HN_PORT: "443",
        },
      });
      const host = config.getHost();
      expect(host).toBe("https://example.com:443");
    });
  });

  describe("Environment-specific Configuration", () => {
    it("should include Node.js specific config when process.env is available", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_PORT: "3001",
          HN_JIRA_USER: "test-user",
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
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_PORT: "3001",
          HN_MAX_RETRY: "3",
          HN_DELAY_BETWEEN_RETRY: "2",
        },
      });
      expect(config.get("environment")).toBe("test");
      expect(config.getConfig().common).toBeDefined();
    });

    it("should get Jira configuration", () => {
      config = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          HN_JIRA_USER: "test-user",
          HN_JIRA_TOKEN: "test-token",
          HN_JIRA_HOST: "https://test.atlassian.net",
          HN_JIRA_BOARD_ID: "123",
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
      config = new HeadNorthConfig({ overrides: { environment: "test" } });
      const stages = config.getStages();

      expect(Array.isArray(stages)).toBe(true);
      expect(stages.length).toBeGreaterThan(0);
      expect(stages[0].id).toBeDefined();
      expect(stages[0].name).toBeDefined();
    });
  });

  describe("Configuration Management", () => {
    beforeEach(() => {
      config = new HeadNorthConfig({ overrides: { environment: "test" } });
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
