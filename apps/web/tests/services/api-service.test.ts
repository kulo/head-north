/**
 * API Service Tests
 * Unit tests for the API service functionality
 */

import { vi } from "vitest";
import { Right, Left } from "purify-ts";
import CycleDataService from "../../src/services/cycle-data-service";
import { HeadNorthConfig } from "@headnorth/config";

// Mock fetch globally
global.fetch = vi.fn();

describe("Cycle Data Service", () => {
  let cycleDataService;
  let headNorthConfig;

  beforeEach(() => {
    vi.mocked(fetch).mockClear();
    headNorthConfig = new HeadNorthConfig();
    // Mock the config to disable retries for testing
    vi.spyOn(headNorthConfig, "getEnvironmentConfig").mockReturnValue({
      backendHost: null,
      timeout: 1000,
      retries: 1,
      retryDelay: 100,
    });
    cycleDataService = new CycleDataService(headNorthConfig);
  });

  describe("Configuration", () => {
    test("should have correct default host", () => {
      // getHost() now combines backend.host and backend.port
      // Default is localhost:3000 with http protocol
      const host = headNorthConfig.getHost();
      expect(host).toBe("http://localhost:3000");
    });

    test("should get host from configuration", () => {
      const host = headNorthConfig.getHost();
      expect(host).toBeDefined();
      expect(typeof host).toBe("string");
    });
  });

  describe("API Endpoints", () => {
    test("should have all required endpoints defined", () => {
      const endpoints = headNorthConfig.getEndpoints();
      expect(endpoints.HEALTH_CHECK).toBe("/healthcheck");
      expect(endpoints.CYCLE_DATA).toBe("/cycle-data");
    });
  });

  describe("Request handling", () => {
    test("should make successful API request", async () => {
      const mockData = {
        cycles: [],
        roadmapItems: [],
        cycleItems: [],
        areas: [],
        objectives: [],
        assignees: [],
        stages: [],
      };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await cycleDataService.getCycleData();

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3000/cycle-data",
        expect.any(Object),
      );
      expect(result.isRight()).toBe(true);
      result.caseOf({
        Right: (data) => {
          expect(data).toEqual({
            cycles: [],
            roadmapItems: [],
            cycleItems: [],
            areas: [],
            objectives: [],
            assignees: [],
            stages: [],
          });
        },
        Left: () => {
          throw new Error("Expected Right, got Left");
        },
      });
    });

    test("should handle API errors gracefully", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      const result = await cycleDataService.getCycleData();
      expect(result.isLeft()).toBe(true);
      result.caseOf({
        Left: (error) => {
          expect(error.message).toContain(
            "API request failed after 1 attempts",
          );
        },
        Right: () => {
          throw new Error("Expected Left, got Right");
        },
      });
    }, 10000);
  });
});
