/**
 * API Service Tests
 * Unit tests for the API service functionality
 */

import { vi } from "vitest";
import CycleDataService from "../../src/services/cycle-data-service";
import { OmegaConfig } from "@omega/config";

// Mock fetch globally
global.fetch = vi.fn();

describe("Cycle Data Service", () => {
  let cycleDataService;
  let omegaConfig;

  beforeEach(() => {
    vi.mocked(fetch).mockClear();
    omegaConfig = new OmegaConfig();
    // Mock the config to disable retries for testing
    vi.spyOn(omegaConfig, "getEnvironmentConfig").mockReturnValue({
      backendHost: null,
      timeout: 1000,
      retries: 1,
      retryDelay: 100,
    });
    cycleDataService = new CycleDataService(omegaConfig);
  });

  describe("Configuration", () => {
    test("should have correct default host", () => {
      expect(omegaConfig.getHost()).toBe("http://localhost:3000");
    });

    test("should get host from configuration", () => {
      const host = omegaConfig.getHost();
      expect(host).toBeDefined();
      expect(typeof host).toBe("string");
    });
  });

  describe("API Endpoints", () => {
    test("should have all required endpoints defined", () => {
      const endpoints = omegaConfig.getEndpoints();
      expect(endpoints.HEALTH_CHECK).toBe("/healthcheck");
      expect(endpoints.CYCLE_DATA).toBe("/cycle-data");
    });
  });

  describe("Request handling", () => {
    test("should make successful API request", async () => {
      const mockData = {
        cycles: [],
        roadmapItems: [],
        releaseItems: [],
        areas: {},
        initiatives: [],
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
      expect(result).toEqual({
        cycles: [],
        roadmapItems: [],
        releaseItems: [],
        areas: [],
        initiatives: [],
        assignees: [],
        stages: [],
      });
    });

    test("should handle API errors gracefully", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      await expect(cycleDataService.getCycleData()).rejects.toThrow(
        "API request failed after 1 attempts",
      );
    }, 10000);
  });
});
