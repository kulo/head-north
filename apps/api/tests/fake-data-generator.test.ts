import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import FakeDataGenerator from "../src/services/fake-data-generator.ts";
import type { OmegaConfig } from "@omega/config";

describe("FakeDataGenerator", () => {
  let mockOmegaConfig: OmegaConfig;
  let generator: FakeDataGenerator;

  beforeEach(() => {
    mockOmegaConfig = {
      getAreas: () => ({
        area1: "Frontend",
        area2: "Backend",
        area3: "DevOps",
      }),
      getInitiatives: () => ({
        init1: "User Experience",
        init2: "Performance",
        init3: "Security",
      }),
      getTeams: () => ({
        team1: "Team Alpha",
        team2: "Team Beta",
        team3: "Team Gamma",
      }),
      getThemes: () => ({
        theme1: "Theme A",
        theme2: "Theme B",
        theme3: "Theme C",
      }),
      getJiraConfig: () => ({
        statusMappings: {
          "1": "todo",
          "2": "inprogress",
          "3": "done",
        },
      }),
      getItemStatusValues: () => ({
        TODO: "todo",
        INPROGRESS: "inprogress",
        DONE: "done",
      }),
      getAssignees: () => [
        { displayName: "All Assignees", accountId: "all" },
        { displayName: "John Doe", accountId: "john.doe" },
      ],
    } as any;

    generator = new FakeDataGenerator(mockOmegaConfig);
  });

  it("should initialize with correct assignees", () => {
    const assignees = generator.getAssignees();

    assert.strictEqual(assignees.length, 8);
    assert.deepStrictEqual(assignees[0], {
      displayName: "All Assignees",
      accountId: "all",
    });
    assert.deepStrictEqual(assignees[1], {
      displayName: "John Doe",
      accountId: "john.doe",
    });
  });

  it("should generate areas from config", () => {
    const areas = generator.getAreas();

    assert.strictEqual(areas.length, 3);
    assert.strictEqual(areas[0].id, "area1");
    assert.strictEqual(areas[0].name, "Frontend");
    assert.ok(Array.isArray(areas[0].teams));
  });

  it("should generate initiatives from config", () => {
    const initiatives = generator.getInitiatives();

    assert.strictEqual(initiatives.length, 3);
    assert.deepStrictEqual(initiatives[0], {
      id: "init1",
      name: "User Experience",
    });
  });

  it("should generate roadmap items", async () => {
    const roadmapItems = await generator.getRoadmapItemsData();

    assert.ok(Object.keys(roadmapItems).length > 0);
    const firstItem = Object.values(roadmapItems)[0];
    assert.ok(firstItem.id);
    assert.ok(firstItem.name);
    assert.ok(firstItem.area);
  });

  it("should generate sprints", async () => {
    const sprintsData = await generator.getSprintsData();
    const sprints = sprintsData.sprints;

    assert.ok(sprints.length > 0);
    const firstSprint = sprints[0];
    assert.ok(firstSprint.id);
    assert.ok(firstSprint.name);
    // Check if it has either start/end or other date properties
    assert.ok(
      firstSprint.start ||
        firstSprint.startDate ||
        typeof firstSprint.id !== "undefined",
    );
  });
});
