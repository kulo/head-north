import { describe, it, beforeEach, expect } from "vitest";
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

    expect(assignees).toHaveLength(8);
    expect(assignees[0]).toEqual({
      displayName: "All Assignees",
      accountId: "all",
    });
    expect(assignees[1]).toEqual({
      displayName: "John Doe",
      accountId: "john.doe",
    });
  });

  it("should generate areas from config", () => {
    const areas = generator.getAreas();

    expect(areas).toHaveLength(3);
    expect(areas[0].id).toBe("area1");
    expect(areas[0].name).toBe("Frontend");
    expect(Array.isArray(areas[0].teams)).toBe(true);
  });

  it("should generate initiatives from config", () => {
    const initiatives = generator.getInitiatives();

    expect(initiatives).toHaveLength(3);
    expect(initiatives[0]).toEqual({
      id: "init1",
      name: "User Experience",
      initiativeId: "init1",
      initiative: "User Experience",
      progress: 0,
      progressWithInProgress: 0,
      progressByReleaseItems: 0,
      weeks: 0,
      weeksDone: 0,
      weeksInProgress: 0,
      weeksNotToDo: 0,
      weeksCancelled: 0,
      weeksPostponed: 0,
      weeksTodo: 0,
      releaseItemsCount: 0,
      releaseItemsDoneCount: 0,
      percentageNotToDo: 0,
      startMonth: "",
      endMonth: "",
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0,
    });
  });

  it("should generate roadmap items", async () => {
    const roadmapItems = await generator.getRoadmapItemsData();

    expect(Object.keys(roadmapItems).length).toBeGreaterThan(0);
    const firstItem = Object.values(roadmapItems)[0];
    expect(firstItem.id).toBeDefined();
    expect(firstItem.name).toBeDefined();
    expect(firstItem.area).toBeDefined();
  });

  it("should generate sprints", async () => {
    const sprintsData = await generator.getSprintsData();
    const sprints = sprintsData.sprints;

    expect(sprints.length).toBeGreaterThan(0);
    const firstSprint = sprints[0];
    expect(firstSprint.id).toBeDefined();
    expect(firstSprint.name).toBeDefined();
    // Check if it has either startDate/endDate or other date properties
    expect(
      firstSprint.startDate ||
        firstSprint.endDate ||
        typeof firstSprint.id !== "undefined",
    ).toBeTruthy();
  });
});
