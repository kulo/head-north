/**
 * Test Fixtures - Cycle Data
 *
 * Provides mock cycle data for testing web app transformers and calculators.
 * These fixtures represent realistic cycle data structures and edge cases.
 */

import type {
  CycleData,
  ReleaseItem,
  RoadmapItem,
  Cycle,
  Initiative,
  Area,
  Person,
  Stage,
} from "@omega/types";
import type {
  NestedCycleData,
  InitiativeWithProgress,
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
 * Create a mock initiative
 */
export function createMockInitiative(
  overrides: Partial<Initiative> = {},
): Initiative {
  return {
    id: "init-1",
    name: "Platform Initiative",
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
    teams: ["team-a", "team-b"],
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
 * Create a mock release item
 */
export function createMockReleaseItem(
  overrides: Partial<ReleaseItem> = {},
): ReleaseItem {
  return {
    id: "RELEASE-001",
    ticketId: "RELEASE-001",
    effort: 2.0,
    projectId: "ROADMAP-001",
    name: "Test Release Item",
    areaIds: ["frontend"],
    teams: ["team-a"],
    status: "inprogress",
    url: "https://test.atlassian.net/browse/RELEASE-001",
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
 * Create a mock release item with different status
 */
export function createMockReleaseItemWithStatus(status: string): ReleaseItem {
  return createMockReleaseItem({
    id: `RELEASE-${status.toUpperCase()}`,
    ticketId: `RELEASE-${status.toUpperCase()}`,
    status,
  });
}

/**
 * Create a mock release item with different effort
 */
export function createMockReleaseItemWithEffort(effort: number): ReleaseItem {
  return createMockReleaseItem({
    id: `RELEASE-EFFORT-${effort}`,
    ticketId: `RELEASE-EFFORT-${effort}`,
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
    labels: ["area:frontend", "theme:platform", "initiative:init-1"],
    area: "frontend",
    theme: "platform",
    url: "https://test.atlassian.net/browse/ROADMAP-001",
    validations: [],
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    initiativeId: "init-1",
    releaseItems: [],
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
      teams: ["team-c"],
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

  const initiatives = [
    createMockInitiative({ id: "init-1", name: "Platform Initiative" }),
    createMockInitiative({ id: "init-2", name: "User Experience Initiative" }),
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
    createMockRoadmapItem({ id: "ROADMAP-001", initiativeId: "init-1" }),
    createMockRoadmapItem({ id: "ROADMAP-002", initiativeId: "init-2" }),
  ];

  const releaseItems = [
    createMockReleaseItem({
      id: "RELEASE-001",
      roadmapItemId: "ROADMAP-001",
      cycleId: "cycle-1",
    }),
    createMockReleaseItem({
      id: "RELEASE-002",
      roadmapItemId: "ROADMAP-001",
      cycleId: "cycle-1",
      status: "done",
    }),
    createMockReleaseItem({
      id: "RELEASE-003",
      roadmapItemId: "ROADMAP-002",
      cycleId: "cycle-1",
      status: "todo",
    }),
  ];

  return {
    cycles,
    initiatives,
    areas,
    assignees,
    stages,
    roadmapItems,
    releaseItems,
    ...overrides,
  };
}

/**
 * Create a mock cycle data with empty collections
 */
export function createEmptyCycleData(): CycleData {
  return {
    cycles: [],
    initiatives: [],
    areas: [],
    assignees: [],
    stages: [],
    roadmapItems: [],
    releaseItems: [],
  };
}

/**
 * Create a mock cycle data with mixed status release items
 */
export function createMockCycleDataWithMixedStatuses(): CycleData {
  const baseData = createMockCycleData();

  const mixedReleaseItems = [
    createMockReleaseItemWithStatus("todo"),
    createMockReleaseItemWithStatus("inprogress"),
    createMockReleaseItemWithStatus("done"),
    createMockReleaseItemWithStatus("cancelled"),
    createMockReleaseItemWithStatus("postponed"),
    createMockReleaseItemWithEffort(0.5),
    createMockReleaseItemWithEffort(1.0),
    createMockReleaseItemWithEffort(2.5),
    createMockReleaseItemWithEffort(5.0),
  ];

  return {
    ...baseData,
    releaseItems: mixedReleaseItems,
  };
}

/**
 * Create a mock nested cycle data
 */
export function createMockNestedCycleData(): NestedCycleData {
  const initiative1: InitiativeWithProgress = {
    id: "init-1",
    name: "Platform Initiative",
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
        releaseItems: [
          createMockReleaseItem({ id: "RELEASE-001", status: "inprogress" }),
          createMockReleaseItem({ id: "RELEASE-002", status: "done" }),
        ],
        weeks: 4.0,
        weeksDone: 2.0,
        weeksInProgress: 2.0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        releaseItemsCount: 2,
        releaseItemsDoneCount: 1,
        progress: 50,
        progressWithInProgress: 100,
        progressByReleaseItems: 50,
        percentageNotToDo: 0,
        startMonth: "Jan",
        endMonth: "Mar",
        daysFromStartOfCycle: 15,
        daysInCycle: 90,
        currentDayPercentage: 17,
      },
    ],
    weeks: 4.0,
    weeksDone: 2.0,
    weeksInProgress: 2.0,
    weeksTodo: 0,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    releaseItemsCount: 2,
    releaseItemsDoneCount: 1,
    progress: 50,
    progressWithInProgress: 100,
    progressByReleaseItems: 50,
    percentageNotToDo: 0,
    startMonth: "Jan",
    endMonth: "Mar",
    daysFromStartOfCycle: 15,
    daysInCycle: 90,
    currentDayPercentage: 17,
  };

  return {
    initiatives: [initiative1],
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
    releaseItems: [
      createMockReleaseItem({ id: "RELEASE-001", status: "inprogress" }),
      createMockReleaseItem({ id: "RELEASE-002", status: "done" }),
    ],
    weeks: 4.0,
    weeksDone: 2.0,
    weeksInProgress: 2.0,
    weeksTodo: 0,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    releaseItemsCount: 2,
    releaseItemsDoneCount: 1,
    progress: 50,
    progressWithInProgress: 100,
    progressByReleaseItems: 50,
    percentageNotToDo: 0,
    startMonth: "Jan",
    endMonth: "Mar",
    daysFromStartOfCycle: 15,
    daysInCycle: 90,
    currentDayPercentage: 17,
  };
}

/**
 * Create a collection of test release items for different scenarios
 */
export function createTestReleaseItemCollection(): ReleaseItem[] {
  return [
    createMockReleaseItemWithStatus("todo"),
    createMockReleaseItemWithStatus("inprogress"),
    createMockReleaseItemWithStatus("done"),
    createMockReleaseItemWithStatus("cancelled"),
    createMockReleaseItemWithStatus("postponed"),
    createMockReleaseItemWithEffort(0.5),
    createMockReleaseItemWithEffort(1.0),
    createMockReleaseItemWithEffort(2.5),
    createMockReleaseItemWithEffort(5.0),
    createMockReleaseItem({
      id: "RELEASE-AREA-OBJECT",
      area: { id: "backend", name: "Backend", teams: [] },
    }),
    createMockReleaseItem({
      id: "RELEASE-AREA-STRING",
      area: "frontend",
    }),
    createMockReleaseItem({
      id: "RELEASE-AREA-IDS",
      areaIds: ["frontend", "backend"],
    }),
  ];
}
