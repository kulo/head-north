/**
 * Request Type Tests
 * Tests for HeadNorthRequest type guard
 */

import { describe, it, expect } from "vitest";
import type { FastifyRequest } from "fastify";
import { isHeadNorthRequest } from "../../src/types/head-north-request";
import type { HeadNorthRequest } from "../../src/types/head-north-request";
import type { HeadNorthConfig } from "@headnorth/config";
import type { JiraAdapter } from "../../src/adapters/jira-adapter.interface";

describe("isHeadNorthRequest", () => {
  it("should return true for request with headNorthConfig and jiraAdapter", () => {
    const mockConfig = {} as HeadNorthConfig;
    const mockAdapter = {} as JiraAdapter;

    const request = {
      headNorthConfig: mockConfig,
      jiraAdapter: mockAdapter,
    } as HeadNorthRequest;

    expect(isHeadNorthRequest(request)).toBe(true);
  });

  it("should return false for request without headNorthConfig", () => {
    const mockAdapter = {} as JiraAdapter;

    const request = {
      jiraAdapter: mockAdapter,
    } as FastifyRequest;

    expect(isHeadNorthRequest(request)).toBe(false);
  });

  it("should return false for request without jiraAdapter", () => {
    const mockConfig = {} as HeadNorthConfig;

    const request = {
      headNorthConfig: mockConfig,
    } as FastifyRequest;

    expect(isHeadNorthRequest(request)).toBe(false);
  });

  it("should return false for request with undefined headNorthConfig", () => {
    const mockAdapter = {} as JiraAdapter;

    const request = {
      headNorthConfig: undefined,
      jiraAdapter: mockAdapter,
    } as unknown as FastifyRequest;

    expect(isHeadNorthRequest(request)).toBe(false);
  });

  it("should return false for request with undefined jiraAdapter", () => {
    const mockConfig = {} as HeadNorthConfig;

    const request = {
      headNorthConfig: mockConfig,
      jiraAdapter: undefined,
    } as unknown as FastifyRequest;

    expect(isHeadNorthRequest(request)).toBe(false);
  });

  it("should return false for empty request", () => {
    const request = {} as FastifyRequest;

    expect(isHeadNorthRequest(request)).toBe(false);
  });
});
