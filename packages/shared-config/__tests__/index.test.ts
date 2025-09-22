/**
 * Shared Config Tests
 * Unit tests for the shared configuration package
 */

import {
  getApiConfig,
  getApiUrl,
  getEnvironmentConfig,
  API_ENDPOINTS,
} from "../index";
import { describe, it } from "node:test";
import assert from "node:assert";

describe("Shared Config", () => {
  describe("API Endpoints", () => {
    it("should have all required endpoints defined", () => {
      assert.strictEqual(API_ENDPOINTS.JIRA_OVERVIEW, "/jira/overview");
      assert.strictEqual(
        API_ENDPOINTS.JIRA_RELEASE_OVERVIEW,
        "/jira/release-overview",
      );
      assert.strictEqual(API_ENDPOINTS.HEALTH_CHECK, "/healthcheck");
    });
  });

  describe("getApiConfig", () => {
    it("should return development config by default", () => {
      const config = getApiConfig();
      assert.strictEqual(config.host, "http://localhost:3000");
      assert.strictEqual(config.timeout, 10000);
      assert.strictEqual(config.retries, 3);
      assert.strictEqual(config.enableLogging, true);
    });

    it("should return production config when specified", () => {
      const config = getApiConfig("production");
      assert.strictEqual(config.host, "https://omega.prewavecom");
      assert.strictEqual(config.timeout, 15000);
      assert.strictEqual(config.retries, 5);
      assert.strictEqual(config.enableLogging, true);
    });

    it("should return test config when specified", () => {
      const config = getApiConfig("test");
      assert.strictEqual(config.host, "http://localhost:3001");
      assert.strictEqual(config.timeout, 5000);
      assert.strictEqual(config.retries, 1);
      assert.strictEqual(config.enableLogging, true);
    });
  });

  describe("getApiUrl", () => {
    it("should construct correct URL for development", () => {
      const url = getApiUrl("/jira/release-overview", "development");
      assert.strictEqual(url, "http://localhost:3000/jira/release-overview");
    });

    it("should construct correct URL for production", () => {
      const url = getApiUrl("/jira/release-overview", "production");
      assert.strictEqual(url, "https://omega.prewavecom/jira/release-overview");
    });

    it("should handle endpoints without leading slash", () => {
      const url = getApiUrl("jira/release-overview", "development");
      assert.strictEqual(url, "http://localhost:3000/jira/release-overview");
    });
  });

  describe("getEnvironmentConfig", () => {
    it("should return development config by default", () => {
      const config = getEnvironmentConfig();
      assert.strictEqual(config.apiHost, "http://localhost:3000");
    });

    it("should return specified environment config", () => {
      const config = getEnvironmentConfig("production");
      assert.strictEqual(config.apiHost, "https://omega.prewavecom");
    });
  });
});
