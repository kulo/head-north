import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createJiraAdapter } from "../../src/adapters/adapter-factory";
import { HeadNorthConfig } from "@headnorth/config";
import { FakeDataAdapter } from "../../src/adapters/fake-data-adapter";
import { PrewaveJiraAdapter } from "../../src/adapters/prewave-jira-adapter";
import { DefaultJiraAdapter } from "../../src/adapters/default-jira-adapter";
import { logger } from "@headnorth/utils";

describe("createJiraAdapter", () => {
  let originalEnv: string | undefined;
  let config: HeadNorthConfig;

  beforeEach(() => {
    // Save original environment variable
    originalEnv = process.env.HN_DATA_SOURCE_ADAPTER;
    // Create config with valid Jira config
    config = new HeadNorthConfig({
      processEnv: {
        NODE_ENV: "test",
        HN_JIRA_USER: "test@prewave.ai",
        HN_JIRA_TOKEN: "test-token",
        HN_JIRA_HOST: "https://prewave.atlassian.net",
        HN_JIRA_BOARD_ID: "1314",
      },
    });
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      process.env.HN_DATA_SOURCE_ADAPTER = originalEnv;
    } else {
      delete process.env.HN_DATA_SOURCE_ADAPTER;
    }
  });

  describe("Adapter Selection", () => {
    it("should return FakeDataAdapter when HN_DATA_SOURCE_ADAPTER=fake", () => {
      process.env.HN_DATA_SOURCE_ADAPTER = "fake";

      const result = createJiraAdapter(config);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const adapter = result.extract();
        expect(adapter).toBeInstanceOf(FakeDataAdapter);
      }
    });

    it("should return PrewaveJiraAdapter when HN_DATA_SOURCE_ADAPTER=prewave", () => {
      process.env.HN_DATA_SOURCE_ADAPTER = "prewave";

      const result = createJiraAdapter(config);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const adapter = result.extract();
        expect(adapter).toBeInstanceOf(PrewaveJiraAdapter);
      }
    });

    it("should return DefaultJiraAdapter when HN_DATA_SOURCE_ADAPTER=default", () => {
      process.env.HN_DATA_SOURCE_ADAPTER = "default";

      const result = createJiraAdapter(config);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const adapter = result.extract();
        expect(adapter).toBeInstanceOf(DefaultJiraAdapter);
      }
    });

    it("should return DefaultJiraAdapter when HN_DATA_SOURCE_ADAPTER is unset", () => {
      delete process.env.HN_DATA_SOURCE_ADAPTER;

      const result = createJiraAdapter(config);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const adapter = result.extract();
        expect(adapter).toBeInstanceOf(DefaultJiraAdapter);
      }
    });

    it("should be case-insensitive for adapter selection", () => {
      process.env.HN_DATA_SOURCE_ADAPTER = "FAKE";

      const result = createJiraAdapter(config);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const adapter = result.extract();
        expect(adapter).toBeInstanceOf(FakeDataAdapter);
      }
    });

    it("should handle mixed case adapter selection", () => {
      process.env.HN_DATA_SOURCE_ADAPTER = "PreWave";

      const result = createJiraAdapter(config);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const adapter = result.extract();
        expect(adapter).toBeInstanceOf(PrewaveJiraAdapter);
      }
    });
  });

  describe("Error Handling", () => {
    it("should return Left<Error> when Jira config is invalid", () => {
      process.env.HN_DATA_SOURCE_ADAPTER = "prewave";
      // Create config without Jira credentials
      const invalidConfig = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          // Missing Jira config
        },
      });

      const result = createJiraAdapter(invalidConfig);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.extract();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should return Left<Error> for Prewave adapter when Jira config is invalid", () => {
      process.env.HN_DATA_SOURCE_ADAPTER = "prewave";
      const invalidConfig = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          // Missing required Jira fields
        },
      });

      const result = createJiraAdapter(invalidConfig);

      expect(result.isLeft()).toBe(true);
    });

    it("should return Left<Error> for Default adapter when Jira config is invalid", () => {
      process.env.HN_DATA_SOURCE_ADAPTER = "default";
      const invalidConfig = new HeadNorthConfig({
        processEnv: {
          NODE_ENV: "test",
          // Missing required Jira fields
        },
      });

      const result = createJiraAdapter(invalidConfig);

      expect(result.isLeft()).toBe(true);
    });
  });

  describe("Logging", () => {
    it("should log when using FakeDataAdapter", () => {
      const logSpy = vi
        .spyOn(logger.default, "info")
        .mockImplementation(() => {});
      process.env.HN_DATA_SOURCE_ADAPTER = "fake";

      createJiraAdapter(config);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("FakeDataAdapter"),
      );
      logSpy.mockRestore();
    });

    it("should log when using PrewaveJiraAdapter", () => {
      const logSpy = vi
        .spyOn(logger.default, "info")
        .mockImplementation(() => {});
      process.env.HN_DATA_SOURCE_ADAPTER = "prewave";

      createJiraAdapter(config);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("PrewaveJiraAdapter"),
      );
      logSpy.mockRestore();
    });

    it("should log when using DefaultJiraAdapter", () => {
      const logSpy = vi
        .spyOn(logger.default, "info")
        .mockImplementation(() => {});
      process.env.HN_DATA_SOURCE_ADAPTER = "default";

      createJiraAdapter(config);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("DefaultJiraAdapter"),
      );
      logSpy.mockRestore();
    });
  });
});
