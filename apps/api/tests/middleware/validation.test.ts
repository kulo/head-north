/**
 * Validation Middleware Tests
 * Tests for Fastify validation middleware
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  validateRequestBody,
  validateResponse,
} from "../../src/middleware/validation";

describe("Validation Middleware", () => {
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;

  beforeEach(() => {
    mockRequest = {
      body: {},
    } as FastifyRequest;

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      statusCode: 200,
    } as unknown as FastifyReply;
  });

  describe("validateRequestBody", () => {
    it("should pass valid request body", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockRequest.body = { name: "Test", age: 25 };

      const middleware = validateRequestBody(schema);
      await middleware(mockRequest, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
      expect((mockRequest as { body: unknown }).body).toEqual({
        name: "Test",
        age: 25,
      });
    });

    it("should reject invalid request body", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockRequest.body = { name: "Test", age: "not a number" };

      const middleware = validateRequestBody(schema);
      await middleware(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "age",
            message: expect.any(String),
            code: expect.any(String),
          }),
        ]),
      });
    });

    it("should handle missing required fields", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockRequest.body = { name: "Test" };

      const middleware = validateRequestBody(schema);
      await middleware(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "age",
          }),
        ]),
      });
    });

    it("should attach validated data to request", async () => {
      const schema = z.object({
        name: z.string().transform((s) => s.toUpperCase()),
        age: z.number(),
      });

      mockRequest.body = { name: "test", age: 25 };

      const middleware = validateRequestBody(schema);
      await middleware(mockRequest, mockReply);

      expect((mockRequest as { body: unknown }).body).toEqual({
        name: "TEST",
        age: 25,
      });
    });
  });

  describe("validateResponse", () => {
    it("should pass valid response payload", async () => {
      const schema = z.object({
        success: z.boolean(),
        data: z.string(),
      });

      const payload = { success: true, data: "test" };
      mockReply.statusCode = 200;

      const middleware = validateResponse(schema);
      const result = await middleware(mockRequest, mockReply, payload);

      expect(result).toEqual(payload);
    });

    it("should log validation errors for invalid responses", async () => {
      const schema = z.object({
        success: z.boolean(),
        data: z.string(),
      });

      const payload = { success: true, data: 123 }; // Invalid: data should be string
      mockReply.statusCode = 200;

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const middleware = validateResponse(schema);
      const result = await middleware(mockRequest, mockReply, payload);

      expect(result).toEqual(payload); // Still returns payload
      expect(consoleSpy).toHaveBeenCalledWith(
        "Response validation failed:",
        expect.any(Array),
      );

      consoleSpy.mockRestore();
    });

    it("should skip validation for error status codes", async () => {
      const schema = z.object({
        success: z.boolean(),
      });

      const payload = { error: "Something went wrong" };
      mockReply.statusCode = 500;

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const middleware = validateResponse(schema);
      const result = await middleware(mockRequest, mockReply, payload);

      expect(result).toEqual(payload);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should skip validation for empty payload", async () => {
      const schema = z.object({
        success: z.boolean(),
      });

      mockReply.statusCode = 200;

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const middleware = validateResponse(schema);
      const result = await middleware(mockRequest, mockReply, null);

      expect(result).toBeNull();
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
