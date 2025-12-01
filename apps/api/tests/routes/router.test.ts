/**
 * Router Tests
 * Tests for route registration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import registerRoutes from "../../src/routes/router";
import type { HeadNorthConfig } from "@headnorth/config";
import * as routeRegistryModule from "../../src/utils/route-registry";
import * as getCycleDataModule from "../../src/controllers/actions/get-cycle-data";

// Mock dependencies
vi.mock("../../src/utils/route-registry");
vi.mock("../../src/controllers/actions/get-cycle-data");

describe("Router", () => {
  let mockFastify: FastifyInstance;
  let mockHeadNorthConfig: HeadNorthConfig;

  beforeEach(() => {
    mockFastify = {
      get: vi.fn(),
    } as unknown as FastifyInstance;

    mockHeadNorthConfig = {
      get: vi.fn(),
    } as unknown as HeadNorthConfig;

    vi.clearAllMocks();
  });

  it("should register root endpoint", () => {
    registerRoutes(mockFastify, mockHeadNorthConfig);

    expect(mockFastify.get).toHaveBeenCalledWith("/", expect.any(Function));
  });

  it("should register routes via registerApiRoutes", () => {
    const mockRegisterApiRoutes = vi.fn();
    vi.mocked(routeRegistryModule.registerApiRoutes).mockImplementation(
      mockRegisterApiRoutes,
    );

    registerRoutes(mockFastify, mockHeadNorthConfig);

    expect(mockRegisterApiRoutes).toHaveBeenCalledWith(
      mockFastify,
      expect.arrayContaining([
        expect.objectContaining({
          method: "GET",
          path: "/healthcheck",
          handler: "healthCheck",
        }),
        expect.objectContaining({
          method: "GET",
          path: "/cycle-data",
          handler: "cycleData",
        }),
      ]),
      expect.objectContaining({
        cycleData: getCycleDataModule.getCycleData,
      }),
    );
  });

  it("should include getCycleData handler", () => {
    registerRoutes(mockFastify, mockHeadNorthConfig);

    const registerCall = vi.mocked(routeRegistryModule.registerApiRoutes).mock
      .calls[0];
    const handlers = registerCall[2] as Record<string, unknown>;

    expect(handlers.cycleData).toBe(getCycleDataModule.getCycleData);
  });

  it("should register healthcheck route", () => {
    registerRoutes(mockFastify, mockHeadNorthConfig);

    const registerCall = vi.mocked(routeRegistryModule.registerApiRoutes).mock
      .calls[0];
    const routes = registerCall[1] as Array<{ path: string; handler: string }>;

    const healthcheckRoute = routes.find((r) => r.path === "/healthcheck");
    expect(healthcheckRoute).toBeDefined();
    expect(healthcheckRoute?.handler).toBe("healthCheck");
  });

  it("should register cycle-data route", () => {
    registerRoutes(mockFastify, mockHeadNorthConfig);

    const registerCall = vi.mocked(routeRegistryModule.registerApiRoutes).mock
      .calls[0];
    const routes = registerCall[1] as Array<{ path: string; handler: string }>;

    const cycleDataRoute = routes.find((r) => r.path === "/cycle-data");
    expect(cycleDataRoute).toBeDefined();
    expect(cycleDataRoute?.handler).toBe("cycleData");
  });
});
