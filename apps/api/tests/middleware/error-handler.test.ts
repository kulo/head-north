/**
 * Error Handler Middleware Tests
 * Tests for Fastify error handler
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import errorHandler from "../../src/middleware/error-handler";
import { logger } from "@headnorth/utils";

describe("Error Handler", () => {
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;

  beforeEach(() => {
    mockRequest = {
      method: "GET",
      url: "/test",
    } as FastifyRequest;

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;

    vi.spyOn(logger.middleware, "errorSafe").mockImplementation(() => {});
  });

  it("should handle Error objects", async () => {
    const error = new Error("Test error") as FastifyError;
    error.stack = "Error: Test error\n    at test.ts:1:1";

    await errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(503);
    expect(mockReply.send).toHaveBeenCalledWith({
      message: "An Error occurred!",
      error: "Test error",
      stack: "Error: Test error\n    at test.ts:1:1",
    });
    expect(logger.middleware.errorSafe).toHaveBeenCalledWith(
      "error-handler",
      error,
    );
  });

  it("should handle errors without message", async () => {
    const error = {} as FastifyError;

    await errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(503);
    // When error is an empty object, toString() returns "[object Object]"
    expect(mockReply.send).toHaveBeenCalledWith({
      message: "An Error occurred!",
      error: "[object Object]",
      stack: "No stack trace available",
    });
  });

  it("should handle errors with toString method", async () => {
    const error = {
      toString: () => "Stringified error",
    } as unknown as FastifyError;

    await errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(503);
    expect(mockReply.send).toHaveBeenCalledWith({
      message: "An Error occurred!",
      error: "Stringified error",
      stack: "No stack trace available",
    });
  });

  it("should handle errors without stack", async () => {
    const error = new Error("Test error") as FastifyError;
    delete error.stack;

    await errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(503);
    expect(mockReply.send).toHaveBeenCalledWith({
      message: "An Error occurred!",
      error: "Test error",
      stack: "No stack trace available",
    });
  });

  it("should log errors safely", async () => {
    const error = new Error("Test error") as FastifyError;

    await errorHandler(error, mockRequest, mockReply);

    expect(logger.middleware.errorSafe).toHaveBeenCalledWith(
      "error-handler",
      error,
    );
  });
});
