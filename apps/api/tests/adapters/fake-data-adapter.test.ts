import { describe, it, expect } from "vitest";
import { FakeDataAdapter } from "../../src/adapters/fake-data-adapter";
import { OmegaConfig } from "@omega/config";

describe("FakeDataAdapter", () => {
  let config: OmegaConfig;
  let adapter: FakeDataAdapter;

  beforeEach(() => {
    config = new OmegaConfig();
    adapter = new FakeDataAdapter(config);
  });

  it("should generate cycle data", async () => {
    const data = await adapter.fetchCycleData();

    expect(data.cycles).toHaveLength(5);
    expect(data.cycles[0]).toMatchObject({
      id: "cycle-1",
      name: "Sprint 1",
      state: "active",
    });
    expect(data.cycles[4]).toMatchObject({
      id: "cycle-5",
      name: "Sprint 5",
      state: "closed",
    });
  });

  it("should generate roadmap items", async () => {
    const data = await adapter.fetchCycleData();

    expect(data.roadmapItems.length).toBeGreaterThan(0);
    expect(data.roadmapItems[0]).toMatchObject({
      id: "PROJ-1",
      name: "Customer Analytics Dashboard",
      area: { id: "platform", name: "Platform" },
      theme: { id: "analytics", name: "Analytics & Insights" },
    });
  });

  it("should generate release items", async () => {
    const data = await adapter.fetchCycleData();

    expect(data.releaseItems.length).toBeGreaterThan(0);
    expect(data.releaseItems[0]).toMatchObject({
      id: expect.stringMatching(/^PROJ-\d+-\d+$/),
      effort: expect.any(Number),
      status: expect.any(String),
      stage: expect.any(String),
    });
  });

  it("should generate areas", async () => {
    const data = await adapter.fetchCycleData();

    expect(data.areas).toBeDefined();
    expect(Object.keys(data.areas).length).toBeGreaterThan(0);
    expect(data.areas.platform).toMatchObject({
      id: "platform",
      name: "Platform",
      teams: expect.any(Array),
    });
  });

  it("should generate initiatives", async () => {
    const data = await adapter.fetchCycleData();

    expect(data.initiatives.length).toBeGreaterThan(0);
    expect(data.initiatives[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it("should generate teams", async () => {
    const data = await adapter.fetchCycleData();

    expect(data.teams.length).toBeGreaterThan(0);
    expect(data.teams[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it("should generate assignees", async () => {
    const data = await adapter.fetchCycleData();

    expect(data.assignees.length).toBeGreaterThan(0);
    expect(data.assignees[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it("should generate stages", async () => {
    const data = await adapter.fetchCycleData();

    expect(data.stages).toBeDefined();
    expect(data.stages.length).toBeGreaterThan(0);
    expect(data.stages[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it("should have consistent data relationships", async () => {
    const data = await adapter.fetchCycleData();

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
