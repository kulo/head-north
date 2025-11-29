/**
 * Test Fixtures - Cycle Data
 *
 * Provides mock cycle data for testing web app transformers and calculators.
 * These fixtures represent realistic cycle data structures and edge cases.
 */

import type {
  CycleData,
  CycleItem,
  RoadmapItem,
  Cycle,
  Objective,
  Area,
  Person,
  Stage,
  Team,
} from "@headnorth/types";
import type {
  NestedCycleData,
  ObjectiveWithProgress,
  RoadmapItemWithProgress,
} from "../../src/types/ui-types";

/**
 * Create a mock cycle
 */
export function createMockCycle(overrides: Partial<Cycle> = {}): Cycle {
  return {
    id: "cycle-1",
    name: "Q1 2024",
    state: "active" as const,
    start: "2024-01-01",
    delivery: "2024-02-15",
    end: "2024-03-31",
    ...overrides,
  };
}

/**
 * Create a mock objective
 */
export function createMockObjective(
  overrides: Partial<Objective> = {},
): Objective {
  return {
    id: "obj-1",
    name: "Platform Objective",
    ...overrides,
  };
}

/**
 * Create a mock team
 */
export function createMockTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: "team-a",
    name: "Team A",
    ...overrides,
  };
}

/**
 * Create a mock area
 */
export function createMockArea(overrides: Partial<Area> = {}): Area {
  return {
    id: "frontend",
    name: "Frontend",
    teams: [
      createMockTeam({ id: "team-a", name: "Team A" }),
      createMockTeam({ id: "team-b", name: "Team B" }),
    ],
    ...overrides,
  };
}

/**
 * Create a mock person
 */
export function createMockPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: "user-1",
    name: "John Doe",
    ...overrides,
  };
}

/**
 * Create a mock stage
 */
export function createMockStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: "s2",
    name: "s2",
    ...overrides,
  };
}

/**
 * Create a mock cycle item
 */
export function createMockCycleItem(
  overrides: Partial<CycleItem> = {},
): CycleItem {
  return {
    id: "CYCLE-001",
    ticketId: "CYCLE-001",
    effort: 2.0,
    name: "Test Cycle Item",
    areaIds: ["frontend"],
    teams: ["team-a"],
    status: "inprogress",
    url: "https://test.atlassian.net/browse/CYCLE-001",
    isExternal: true,
    stage: "s2",
    assignee: {
      id: "user-1",
      name: "John Doe",
    },
    validations: [],
    roadmapItemId: "ROADMAP-001",
    cycleId: "cycle-1",
    ...overrides,
  };
}

/**
 * Create a mock cycle item with different status
 */
export function createMockCycleItemWithStatus(status: string): CycleItem {
  return createMockCycleItem({
    id: `CYCLE-${status.toUpperCase()}`,
    ticketId: `CYCLE-${status.toUpperCase()}`,
    status,
  });
}

/**
 * Create a mock cycle item with different effort
 */
export function createMockCycleItemWithEffort(effort: number): CycleItem {
  return createMockCycleItem({
    id: `CYCLE-EFFORT-${effort}`,
    ticketId: `CYCLE-EFFORT-${effort}`,
    effort,
  });
}

/**
 * Create a mock roadmap item
 */
export function createMockRoadmapItem(
  overrides: Partial<RoadmapItem> = {},
): RoadmapItem {
  return {
    id: "ROADMAP-001",
    summary: "Test Roadmap Item",
    name: "Test Roadmap Item",
    labels: ["area:frontend", "theme:platform", "objective:obj-1"],
    area: "frontend",
    theme: "platform",
    url: "https://test.atlassian.net/browse/ROADMAP-001",
    validations: [],
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    objectiveId: "obj-1",
    cycleItems: [],
    ...overrides,
  };
}

/**
 * Create a mock roadmap item with area object
 */
export function createMockRoadmapItemWithAreaObject(): RoadmapItem {
  return createMockRoadmapItem({
    id: "ROADMAP-002",
    area: {
      id: "backend",
      name: "Backend",
      teams: [createMockTeam({ id: "team-c", name: "Team C" })],
    },
  });
}

/**
 * Create a mock cycle data with all components
 */
export function createMockCycleData(
  overrides: Partial<CycleData> = {},
): CycleData {
  const cycles = [
    createMockCycle({ id: "cycle-1", name: "Q1 2024" }),
    createMockCycle({ id: "cycle-2", name: "Q2 2024", state: "closed" }),
  ];

  const objectives = [
    createMockObjective({ id: "obj-1", name: "Platform Objective" }),
    createMockObjective({ id: "obj-2", name: "User Experience Objective" }),
  ];

  const areas = [
    createMockArea({ id: "frontend", name: "Frontend" }),
    createMockArea({ id: "backend", name: "Backend" }),
  ];

  const assignees = [
    createMockPerson({ id: "user-1", name: "John Doe" }),
    createMockPerson({ id: "user-2", name: "Jane Smith" }),
  ];

  const stages = [
    createMockStage({ id: "s1", name: "s1" }),
    createMockStage({ id: "s2", name: "s2" }),
    createMockStage({ id: "s3", name: "s3" }),
    createMockStage({ id: "s3+", name: "s3+" }),
  ];

  const roadmapItems = [
    createMockRoadmapItem({ id: "ROADMAP-001", objectiveId: "obj-1" }),
    createMockRoadmapItem({ id: "ROADMAP-002", objectiveId: "obj-2" }),
  ];

  const cycleItems = [
    createMockCycleItem({
      id: "CYCLE-001",
      roadmapItemId: "ROADMAP-001",
      cycleId: "cycle-1",
    }),
    createMockCycleItem({
      id: "CYCLE-002",
      roadmapItemId: "ROADMAP-001",
      cycleId: "cycle-1",
      status: "done",
    }),
    createMockCycleItem({
      id: "CYCLE-003",
      roadmapItemId: "ROADMAP-002",
      cycleId: "cycle-1",
      status: "todo",
    }),
  ];

  return {
    cycles,
    objectives,
    areas,
    assignees,
    stages,
    roadmapItems,
    cycleItems,
    ...overrides,
  };
}

/**
 * Create a mock cycle data with empty collections
 */
export function createEmptyCycleData(): CycleData {
  return {
    cycles: [],
    objectives: [],
    areas: [],
    assignees: [],
    stages: [],
    roadmapItems: [],
    cycleItems: [],
  };
}

/**
 * Create a mock cycle data with mixed status cycle items
 */
export function createMockCycleDataWithMixedStatuses(): CycleData {
  const baseData = createMockCycleData();

  const mixedCycleItems = [
    createMockCycleItemWithStatus("todo"),
    createMockCycleItemWithStatus("inprogress"),
    createMockCycleItemWithStatus("done"),
    createMockCycleItemWithStatus("cancelled"),
    createMockCycleItemWithStatus("postponed"),
    createMockCycleItemWithEffort(0.5),
    createMockCycleItemWithEffort(1.0),
    createMockCycleItemWithEffort(2.5),
    createMockCycleItemWithEffort(5.0),
  ];

  return {
    ...baseData,
    cycleItems: mixedCycleItems,
  };
}

/**
 * Create a mock nested cycle data
 */
export function createMockNestedCycleData(): NestedCycleData {
  const objective1: ObjectiveWithProgress = {
    id: "obj-1",
    name: "Platform Objective",
    roadmapItems: [
      {
        id: "ROADMAP-001",
        name: "Test Roadmap Item",
        summary: "Test Roadmap Item",
        labels: ["area:frontend"],
        area: "frontend",
        theme: "platform",
        url: "https://test.atlassian.net/browse/ROADMAP-001",
        validations: [],
        startDate: "2024-01-01",
        endDate: "2024-03-31",
        cycleItems: [
          createMockCycleItem({ id: "CYCLE-001", status: "inprogress" }),
          createMockCycleItem({ id: "CYCLE-002", status: "done" }),
        ],
        weeks: 4.0,
        weeksDone: 2.0,
        weeksInProgress: 2.0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        cycleItemsCount: 2,
        cycleItemsDoneCount: 1,
        progress: 50,
        progressWithInProgress: 100,
        progressByCycleItems: 50,
        percentageNotToDo: 0,
        daysFromStartOfCycle: 15,
        daysInCycle: 90,
        currentDayPercentage: 17,
      } as RoadmapItemWithProgress,
    ],
    weeks: 4.0,
    weeksDone: 2.0,
    weeksInProgress: 2.0,
    weeksTodo: 0,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    cycleItemsCount: 2,
    cycleItemsDoneCount: 1,
    progress: 50,
    progressWithInProgress: 100,
    progressByCycleItems: 50,
    percentageNotToDo: 0,
    daysFromStartOfCycle: 15,
    daysInCycle: 90,
    currentDayPercentage: 17,
  };

  return {
    objectives: [objective1],
  };
}

/**
 * Create a mock roadmap item with progress
 */
export function createMockRoadmapItemWithProgress(): RoadmapItemWithProgress {
  return {
    id: "ROADMAP-001",
    name: "Test Roadmap Item",
    summary: "Test Roadmap Item",
    labels: ["area:frontend"],
    area: "frontend",
    theme: "platform",
    url: "https://test.atlassian.net/browse/ROADMAP-001",
    validations: [],
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    cycleItems: [
      createMockCycleItem({ id: "CYCLE-001", status: "inprogress" }),
      createMockCycleItem({ id: "CYCLE-002", status: "done" }),
    ],
    weeks: 4.0,
    weeksDone: 2.0,
    weeksInProgress: 2.0,
    weeksTodo: 0,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    cycleItemsCount: 2,
    cycleItemsDoneCount: 1,
    progress: 50,
    progressWithInProgress: 100,
    progressByCycleItems: 50,
    percentageNotToDo: 0,
    daysFromStartOfCycle: 15,
    daysInCycle: 90,
    currentDayPercentage: 17,
  };
}

/**
 * Create a collection of test cycle items for different scenarios
 */
export function createTestCycleItemCollection(): CycleItem[] {
  return [
    createMockCycleItemWithStatus("todo"),
    createMockCycleItemWithStatus("inprogress"),
    createMockCycleItemWithStatus("done"),
    createMockCycleItemWithStatus("cancelled"),
    createMockCycleItemWithStatus("postponed"),
    createMockCycleItemWithEffort(0.5),
    createMockCycleItemWithEffort(1.0),
    createMockCycleItemWithEffort(2.5),
    createMockCycleItemWithEffort(5.0),
    createMockCycleItem({
      id: "CYCLE-AREA-OBJECT",
      area: { id: "backend", name: "Backend", teams: [] },
    }),
    createMockCycleItem({
      id: "CYCLE-AREA-STRING",
      area: "frontend",
    }),
    createMockCycleItem({
      id: "CYCLE-AREA-IDS",
      areaIds: ["frontend", "backend"],
    }),
  ];
}
