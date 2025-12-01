/**
 * Route Registry Tests
 * Tests for route registration utility
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  registerApiRoutes,
  getRegisteredRoutes,
} from "../../src/utils/route-registry";
import { logger } from "@headnorth/utils";

describe("Route Registry", () => {
  let mockFastify: FastifyInstance;
  let registeredRoutes: Array<{
    method: string;
    path: string;
    handler: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }>;

  beforeEach(() => {
    registeredRoutes = [];
    mockFastify = {
      get: vi.fn((path: string, handler: unknown) => {
        registeredRoutes.push({
          method: "GET",
          path,
          handler: handler as (
            request: FastifyRequest,
            reply: FastifyReply,
          ) => Promise<void>,
        });
      }),
      post: vi.fn((path: string, handler: unknown) => {
        registeredRoutes.push({
          method: "POST",
          path,
          handler: handler as (
            request: FastifyRequest,
            reply: FastifyReply,
          ) => Promise<void>,
        });
      }),
      put: vi.fn((path: string, handler: unknown) => {
        registeredRoutes.push({
          method: "PUT",
          path,
          handler: handler as (
            request: FastifyRequest,
            reply: FastifyReply,
          ) => Promise<void>,
        });
      }),
      delete: vi.fn((path: string, handler: unknown) => {
        registeredRoutes.push({
          method: "DELETE",
          path,
          handler: handler as (
            request: FastifyRequest,
            reply: FastifyReply,
          ) => Promise<void>,
        });
      }),
      printRoutes: vi.fn(() => "GET    /test\nPOST   /api/data"),
    } as unknown as FastifyInstance;

    vi.spyOn(logger.default, "info").mockImplementation(() => {});
  });

  describe("registerApiRoutes", () => {
    it("should register GET routes", () => {
      const routes = [
        {
          method: "GET",
          path: "/test",
          handler: "testHandler",
          description: "Test endpoint",
        },
      ];

      const handlers = {
        testHandler: vi.fn(),
      };

      registerApiRoutes(mockFastify, routes, handlers);

      expect(mockFastify.get).toHaveBeenCalledWith(
        "/test",
        handlers.testHandler,
      );
      expect(logger.default.info).toHaveBeenCalledWith("Route registered", {
        method: "GET",
        path: "/test",
        description: "Test endpoint",
      });
    });

    it("should register POST routes", () => {
      const routes = [
        {
          method: "POST",
          path: "/api/data",
          handler: "dataHandler",
          description: "Data endpoint",
        },
      ];

      const handlers = {
        dataHandler: vi.fn(),
      };

      registerApiRoutes(mockFastify, routes, handlers);

      expect(mockFastify.post).toHaveBeenCalledWith(
        "/api/data",
        handlers.dataHandler,
      );
    });

    it("should register PUT routes", () => {
      const routes = [
        {
          method: "PUT",
          path: "/api/update",
          handler: "updateHandler",
          description: "Update endpoint",
        },
      ];

      const handlers = {
        updateHandler: vi.fn(),
      };

      registerApiRoutes(mockFastify, routes, handlers);

      expect(mockFastify.put).toHaveBeenCalledWith(
        "/api/update",
        handlers.updateHandler,
      );
    });

    it("should register DELETE routes", () => {
      const routes = [
        {
          method: "DELETE",
          path: "/api/delete",
          handler: "deleteHandler",
          description: "Delete endpoint",
        },
      ];

      const handlers = {
        deleteHandler: vi.fn(),
      };

      registerApiRoutes(mockFastify, routes, handlers);

      expect(mockFastify.delete).toHaveBeenCalledWith(
        "/api/delete",
        handlers.deleteHandler,
      );
    });

    it("should use default health check handler when handler not found", () => {
      const routes = [
        {
          method: "GET",
          path: "/health",
          handler: "missingHandler",
          description: "Health check",
        },
      ];

      const handlers = {};

      registerApiRoutes(mockFastify, routes, handlers);

      expect(mockFastify.get).toHaveBeenCalled();
      const callArgs = vi.mocked(mockFastify.get).mock.calls[0];
      expect(callArgs[0]).toBe("/health");
      expect(typeof callArgs[1]).toBe("function");
    });

    it("should support function handlers directly", () => {
      const handler = vi.fn();
      const routes = [
        {
          method: "GET",
          path: "/direct",
          handler,
          description: "Direct handler",
        },
      ];

      registerApiRoutes(mockFastify, routes, {});

      expect(mockFastify.get).toHaveBeenCalledWith("/direct", handler);
    });

    it("should apply prefix to routes", () => {
      const routes = [
        {
          method: "GET",
          path: "/test",
          handler: "testHandler",
          description: "Test endpoint",
        },
      ];

      const handlers = {
        testHandler: vi.fn(),
      };

      registerApiRoutes(mockFastify, routes, handlers, { prefix: "/api/v1" });

      expect(mockFastify.get).toHaveBeenCalledWith(
        "/api/v1/test",
        handlers.testHandler,
      );
    });

    it("should log route registration summary", () => {
      const routes = [
        {
          method: "GET",
          path: "/test1",
          handler: "handler1",
          description: "Test 1",
        },
        {
          method: "GET",
          path: "/test2",
          handler: "handler2",
          description: "Test 2",
        },
      ];

      const handlers = {
        handler1: vi.fn(),
        handler2: vi.fn(),
      };

      registerApiRoutes(mockFastify, routes, handlers);

      expect(logger.default.info).toHaveBeenCalledWith(
        "API routes registered",
        {
          totalRoutes: 2,
          routePaths: ["/test1", "/test2"],
        },
      );
    });

    it("should not log routes when logRoutes is false", () => {
      const routes = [
        {
          method: "GET",
          path: "/test",
          handler: "testHandler",
          description: "Test endpoint",
        },
      ];

      const handlers = {
        testHandler: vi.fn(),
      };

      vi.mocked(logger.default.info).mockClear();
      registerApiRoutes(mockFastify, routes, handlers, { logRoutes: false });

      expect(logger.default.info).not.toHaveBeenCalled();
      expect(mockFastify.get).toHaveBeenCalled(); // Route still registered
    });
  });

  describe("getRegisteredRoutes", () => {
    it("should parse routes from printRoutes output", () => {
      const routes = getRegisteredRoutes(mockFastify);

      expect(routes).toEqual([
        { method: "GET", path: "/test" },
        { method: "POST", path: "/api/data" },
      ]);
    });

    it("should handle empty routes", () => {
      const emptyFastify = {
        printRoutes: vi.fn(() => ""),
      } as unknown as FastifyInstance;

      const routes = getRegisteredRoutes(emptyFastify);

      expect(routes).toEqual([]);
    });

    it("should handle malformed route output", () => {
      const malformedFastify = {
        printRoutes: vi.fn(() => "invalid line\nGET    /valid"),
      } as unknown as FastifyInstance;

      const routes = getRegisteredRoutes(malformedFastify);

      // Should filter out invalid lines and only return valid routes
      expect(routes.length).toBeGreaterThan(0);
      expect(
        routes.some((r) => r.method === "GET" && r.path === "/valid"),
      ).toBe(true);
    });
  });
});
