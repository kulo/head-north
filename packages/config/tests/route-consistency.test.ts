/**
 * Route Consistency Tests
 * Tests to ensure frontend and backend use the same API paths
 */

import { OmegaConfig } from "../dist/index.js";
import { describe, it } from "node:test";
import assert from "node:assert";

describe("Route Consistency", () => {
  describe("API Endpoints", () => {
    it("should have consistent endpoint paths", () => {
      const config = new OmegaConfig();
      const endpoints = config.getEndpoints();

      // These paths must match exactly between frontend and backend
      assert.ok(endpoints.HEALTH_CHECK);
      assert.ok(endpoints.CYCLE_DATA);
    });

    it("should have all endpoints start with forward slash", () => {
      const config = new OmegaConfig();
      const endpoints = config.getEndpoints();

      Object.values(endpoints).forEach((endpoint) => {
        assert.match(
          endpoint,
          /^\//,
          `Endpoint ${endpoint} should start with forward slash`,
        );
      });
    });

    it("should not have trailing slashes", () => {
      const config = new OmegaConfig();
      const endpoints = config.getEndpoints();

      Object.values(endpoints).forEach((endpoint) => {
        assert.doesNotMatch(
          endpoint,
          /\/$/,
          `Endpoint ${endpoint} should not have trailing slash`,
        );
      });
    });

    it("should have consistent naming convention", () => {
      const config = new OmegaConfig();
      const endpoints = config.getEndpoints();

      Object.values(endpoints).forEach((endpoint) => {
        // Should be lowercase with hyphens or forward slashes
        assert.match(
          endpoint,
          /^\/[a-z0-9\/-]+$/,
          `Endpoint ${endpoint} should follow naming convention`,
        );
      });
    });
  });

  describe("Endpoint Structure", () => {
    it("should have health check endpoint", () => {
      const config = new OmegaConfig();
      const endpoints = config.getEndpoints();

      assert.ok(endpoints.HEALTH_CHECK);
      assert.match(endpoints.HEALTH_CHECK, /^\/healthcheck/);
    });

    it("should have cycle data endpoint", () => {
      const config = new OmegaConfig();
      const endpoints = config.getEndpoints();

      assert.ok(endpoints.CYCLE_DATA);
      assert.match(endpoints.CYCLE_DATA, /^\/cycle-data/);
    });
  });
});
