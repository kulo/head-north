/**
 * Get Cycle Data Controller Tests
 * Tests for the get-cycle-data controller
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest, FastifyReply } from "fastify";
import { getCycleData } from "../../src/controllers/actions/get-cycle-data";
import type { HeadNorthRequest } from "../../src/types/head-north-request";
import type { HeadNorthConfig } from "@headnorth/config";
import type { JiraAdapter } from "../../src/adapters/jira-adapter.interface";
import type { CycleData } from "@headnorth/types";
import { Right, Left } from "@headnorth/utils";
import { logger } from "@headnorth/utils";
import * as collectCycleDataModule from "../../src/services/collect-cycle-data";

// Mock the collect-cycle-data service
vi.mock("../../src/services/collect-cycle-data", () => ({
  default: vi.fn(),
  validateAndPrepareCycleData: vi.fn(),
}));

describe("getCycleData Controller", () => {
  let mockRequest: HeadNorthRequest;
  let mockReply: FastifyReply;
  let mockHeadNorthConfig: HeadNorthConfig;
  let mockJiraAdapter: JiraAdapter;

  beforeEach(() => {
    mockHeadNorthConfig = {
      get: vi.fn(),
    } as unknown as HeadNorthConfig;

    mockJiraAdapter = {
      fetchCycleData: vi.fn(),
    } as unknown as JiraAdapter;

    mockRequest = {
      headNorthConfig: mockHeadNorthConfig,
      jiraAdapter: mockJiraAdapter,
    } as HeadNorthRequest;

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;

    vi.spyOn(logger.default, "info").mockImplementation(() => {});
    vi.spyOn(logger.default, "errorSafe").mockImplementation(() => {});
  });

  it("should return cycle data on success", async () => {
    const mockCycleData: CycleData = {
      cycles: [
        {
          id: "1",
          name: "Cycle 1",
          start: "2024-01-01",
          end: "2024-01-14",
          delivery: "2024-01-14",
          state: "active",
        },
      ],
      roadmapItems: [],
      cycleItems: [],
      assignees: [],
      areas: [],
      stages: [],
      objectives: [],
    };

    vi.mocked(collectCycleDataModule.default).mockResolvedValue(
      Right(mockCycleData),
    );
    vi.mocked(
      collectCycleDataModule.validateAndPrepareCycleData,
    ).mockReturnValue(Right(mockCycleData));

    await getCycleData(mockRequest, mockReply);

    expect(collectCycleDataModule.default).toHaveBeenCalledWith(
      mockJiraAdapter,
      mockHeadNorthConfig,
    );
    expect(mockReply.send).toHaveBeenCalledWith(mockCycleData);
    expect(mockReply.status).not.toHaveBeenCalled();
    expect(logger.default.info).toHaveBeenCalledWith("fetching raw cycle data");
  });

  it("should handle validation errors", async () => {
    const mockCycleData: CycleData = {
      cycles: [],
      roadmapItems: [],
      cycleItems: [],
      assignees: [],
      areas: [],
      stages: [],
      objectives: [],
    };

    const validationErrors = [
      { field: "cycles", message: "Cycles are required" },
    ];
    const validationError = new Error(
      `Data validation failed: ${validationErrors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
    );
    (
      validationError as Error & { validationErrors?: unknown[] }
    ).validationErrors = validationErrors;

    vi.mocked(collectCycleDataModule.default).mockResolvedValue(
      Right(mockCycleData),
    );
    vi.mocked(
      collectCycleDataModule.validateAndPrepareCycleData,
    ).mockReturnValue(Left(validationError));

    await getCycleData(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: validationError.message,
      validationErrors: validationErrors,
    });
    expect(logger.default.errorSafe).toHaveBeenCalledWith(
      "Cycle data operation failed",
      validationError,
    );
  });

  it("should handle adapter errors", async () => {
    const adapterError = new Error("JIRA API error");

    vi.mocked(collectCycleDataModule.default).mockResolvedValue(
      Left(adapterError),
    );

    await getCycleData(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: adapterError.message,
    });
    expect(logger.default.errorSafe).toHaveBeenCalledWith(
      "Cycle data operation failed",
      adapterError,
    );
  });

  it("should handle non-Error adapter failures", async () => {
    const adapterError = new Error("String error");

    vi.mocked(collectCycleDataModule.default).mockResolvedValue(
      Left(adapterError),
    );

    await getCycleData(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: adapterError.message,
    });
  });

  it("should log successful data validation", async () => {
    const mockCycleData: CycleData = {
      cycles: [
        {
          id: "1",
          name: "Cycle 1",
          start: "2024-01-01",
          end: "2024-01-14",
          delivery: "2024-01-14",
          state: "active",
        },
      ],
      roadmapItems: [{ id: "R1", name: "Roadmap 1" }],
      cycleItems: [
        {
          id: "C1",
          ticketId: "T1",
          name: "Item 1",
          status: "todo",
          stage: "dev",
          assignee: { id: "1", name: "User" },
        },
      ],
      assignees: [],
      areas: [],
      stages: [],
      objectives: [],
    };

    vi.mocked(collectCycleDataModule.default).mockResolvedValue(
      Right(mockCycleData),
    );
    vi.mocked(
      collectCycleDataModule.validateAndPrepareCycleData,
    ).mockReturnValue(Right(mockCycleData));

    await getCycleData(mockRequest, mockReply);

    expect(logger.default.info).toHaveBeenCalledWith(
      expect.stringContaining("Raw cycle data validated successfully"),
    );
  });
});
