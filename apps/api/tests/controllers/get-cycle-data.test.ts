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

    vi.mocked(mockJiraAdapter.fetchCycleData).mockResolvedValue(
      Right(mockCycleData),
    );

    await getCycleData(mockRequest, mockReply);

    expect(mockJiraAdapter.fetchCycleData).toHaveBeenCalled();
    expect(mockReply.send).toHaveBeenCalledWith(mockCycleData);
    expect(mockReply.status).not.toHaveBeenCalled();
    expect(logger.default.info).toHaveBeenCalledWith("fetching raw cycle data");
  });

  it("should handle adapter errors", async () => {
    const adapterError = new Error("JIRA API error");

    vi.mocked(mockJiraAdapter.fetchCycleData).mockResolvedValue(
      Left(adapterError),
    );

    await getCycleData(mockRequest, mockReply);

    expect(mockJiraAdapter.fetchCycleData).toHaveBeenCalled();
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: adapterError.message,
    });
    expect(logger.default.errorSafe).toHaveBeenCalledWith(
      "Getting cycle data failed!",
      adapterError,
    );
  });

  it("should handle non-Error adapter failures", async () => {
    const adapterError = new Error("String error");

    vi.mocked(mockJiraAdapter.fetchCycleData).mockResolvedValue(
      Left(adapterError),
    );

    await getCycleData(mockRequest, mockReply);

    expect(mockJiraAdapter.fetchCycleData).toHaveBeenCalled();
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: adapterError.message,
    });
  });

  it("should log successful data preparation", async () => {
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

    vi.mocked(mockJiraAdapter.fetchCycleData).mockResolvedValue(
      Right(mockCycleData),
    );

    await getCycleData(mockRequest, mockReply);

    expect(mockJiraAdapter.fetchCycleData).toHaveBeenCalled();
    expect(logger.default.info).toHaveBeenCalledWith(
      expect.stringContaining("Raw cycle data fetched successfully"),
    );
  });
});
