import { describe, it, expect, beforeEach } from "vitest";
import { FakeDataAdapter } from "../../src/adapters/fake-data-adapter";
import { OmegaConfig } from "@omega/config";
import { RawCycleData } from "@omega/types";
import { Either } from "@omega/utils";

describe("FakeDataAdapter", () => {
  let config: OmegaConfig;
  let adapter: FakeDataAdapter;

  beforeEach(() => {
    config = new OmegaConfig();
    adapter = new FakeDataAdapter(config);
  });

  it("should generate cycle data", async () => {
    const result = (await adapter.fetchCycleData()) as Either<
      Error,
      RawCycleData
    >;

    expect(result.isRight()).toBe(true);
    const data = result.extract() as RawCycleData;
    expect(data.cycles).toHaveLength(4);
    expect(data.cycles[0]).toMatchObject({
      id: expect.stringMatching(/^\d+$/),
      name: expect.stringMatching(/^[A-Za-z]{3}-[A-Za-z]{3} \d{4}$/),
      state: expect.any(String),
    });
    expect(data.cycles[3]).toMatchObject({
      id: expect.stringMatching(/^\d+$/),
      name: expect.stringMatching(/^[A-Za-z]{3}-[A-Za-z]{3} \d{4}$/),
      state: expect.any(String),
    });
  });

  it("should generate roadmap items", async () => {
    const result = (await adapter.fetchCycleData()) as Either<
      Error,
      RawCycleData
    >;

    expect(result.isRight()).toBe(true);
    const data = result.extract() as RawCycleData;
    expect(data.roadmapItems.length).toBeGreaterThan(0);
    expect(data.roadmapItems[0]).toMatchObject({
      id: expect.stringMatching(/^ROAD-\d+$/),
      name: expect.stringMatching(/^.+ - \d+$/),
      area: expect.any(String),
      initiativeId: expect.any(String),
    });
  });

  it("should generate release items", async () => {
    const result = (await adapter.fetchCycleData()) as Either<
      Error,
      RawCycleData
    >;

    expect(result.isRight()).toBe(true);
    const data = result.extract() as RawCycleData;
    expect(data.releaseItems.length).toBeGreaterThan(0);
    expect(data.releaseItems[0]).toMatchObject({
      id: expect.stringMatching(/^ROAD-\d+-RELEASE-\d+$/),
      effort: expect.any(Number),
      status: expect.any(String),
      stage: expect.any(String),
    });
  });

  it("should generate areas", async () => {
    const result = (await adapter.fetchCycleData()) as Either<
      Error,
      RawCycleData
    >;

    expect(result.isRight()).toBe(true);
    const data = result.extract() as RawCycleData;
    expect(data.areas).toBeDefined();
    expect(Object.keys(data.areas).length).toBeGreaterThan(0);
    expect(data.areas.platform).toMatchObject({
      id: "platform",
      name: "Platform",
      teams: expect.any(Array),
    });
  });

  it("should generate initiatives", async () => {
    const result = (await adapter.fetchCycleData()) as Either<
      Error,
      RawCycleData
    >;

    expect(result.isRight()).toBe(true);
    const data = result.extract() as RawCycleData;
    expect(data.initiatives.length).toBeGreaterThan(0);
    expect(data.initiatives[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it("should generate teams", async () => {
    const result = (await adapter.fetchCycleData()) as Either<
      Error,
      RawCycleData
    >;

    expect(result.isRight()).toBe(true);
    const data = result.extract() as RawCycleData;
    expect(data.teams?.length).toBeGreaterThan(0);
    expect(data.teams?.[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it("should generate assignees", async () => {
    const result = (await adapter.fetchCycleData()) as Either<
      Error,
      RawCycleData
    >;

    expect(result.isRight()).toBe(true);
    const data = result.extract() as RawCycleData;
    expect(data.assignees.length).toBeGreaterThan(0);
    expect(data.assignees[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it("should generate stages", async () => {
    const result = (await adapter.fetchCycleData()) as Either<
      Error,
      RawCycleData
    >;

    expect(result.isRight()).toBe(true);
    const data = result.extract() as RawCycleData;
    expect(data.stages).toBeDefined();
    expect(data.stages.length).toBeGreaterThan(0);
    expect(data.stages[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it("should have consistent data relationships", async () => {
    const result = (await adapter.fetchCycleData()) as Either<
      Error,
      RawCycleData
    >;

    expect(result.isRight()).toBe(true);
    const data = result.extract() as RawCycleData;

    // Check that release items reference valid roadmap items
    data.releaseItems.forEach((releaseItem) => {
      if (releaseItem.roadmapItemId) {
        const roadmapItem = data.roadmapItems.find(
          (ri) => ri.id === releaseItem.roadmapItemId,
        );
        expect(roadmapItem).toBeDefined();
      }
    });

    // Check that release items reference valid cycles
    data.releaseItems.forEach((releaseItem) => {
      if (releaseItem.cycleId) {
        const cycle = data.cycles.find((c) => c.id === releaseItem.cycleId);
        expect(cycle).toBeDefined();
      }
    });
  });
});
