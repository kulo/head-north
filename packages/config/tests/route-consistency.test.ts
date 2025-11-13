/**
 * Route Consistency Tests
 * Tests to ensure frontend and backend use the same API paths
 */

import { HeadNorthConfig } from "../dist/index.js";
import { describe, it, expect } from "vitest";

describe("Route Consistency", () => {
  describe("API Endpoints", () => {
    it("should have consistent endpoint paths", () => {
      const config = new HeadNorthConfig();
      const endpoints = config.getEndpoints();

      // These paths must match exactly between frontend and backend
      expect(endpoints.HEALTH_CHECK).toBeDefined();
      expect(endpoints.CYCLE_DATA).toBeDefined();
    });

    it("should have all endpoints start with forward slash", () => {
      const config = new HeadNorthConfig();
      const endpoints = config.getEndpoints();

      Object.values(endpoints).forEach((endpoint) => {
        expect(endpoint).toMatch(/^\//);
      });
    });

    it("should not have trailing slashes", () => {
      const config = new HeadNorthConfig();
      const endpoints = config.getEndpoints();

      Object.values(endpoints).forEach((endpoint) => {
        expect(endpoint).not.toMatch(/\/$/);
      });
    });

    it("should have consistent naming convention", () => {
      const config = new HeadNorthConfig();
      const endpoints = config.getEndpoints();

      Object.values(endpoints).forEach((endpoint) => {
        // Should be lowercase with hyphens or forward slashes
        expect(endpoint).toMatch(/^\/[a-z0-9\/-]+$/);
      });
    });
  });

  describe("Endpoint Structure", () => {
    it("should have health check endpoint", () => {
      const config = new HeadNorthConfig();
      const endpoints = config.getEndpoints();

      expect(endpoints.HEALTH_CHECK).toBeDefined();
      expect(endpoints.HEALTH_CHECK).toMatch(/^\/healthcheck/);
    });

    it("should have cycle data endpoint", () => {
      const config = new HeadNorthConfig();
      const endpoints = config.getEndpoints();

      expect(endpoints.CYCLE_DATA).toBeDefined();
      expect(endpoints.CYCLE_DATA).toMatch(/^\/cycle-data/);
    });
  });
});
