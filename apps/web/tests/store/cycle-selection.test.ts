import { vi } from "vitest";
import { createStore } from "vuex";
import createAppStore from "../../src/store/index";

// Mock the CycleDataService
const mockCycleDataService = {
  getAllCycles: vi.fn(),
};

// Mock omegaConfig
const mockOmegaConfig = {
  getFrontendConfig: () => ({
    getAllPages: () => [
      { id: "cycle-overview", name: "Cycle Overview", path: "/cycle-overview" },
    ],
  }),
  getPage: (pageId) => ({
    id: pageId,
    name: "Cycle Overview",
    path: "/cycle-overview",
  }),
};

// Mock router
const mockRouter = {
  currentRoute: { value: { path: "/cycle-overview" } },
  push: vi.fn(),
};

describe("Cycle Selection Logic", () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createAppStore(mockCycleDataService, mockOmegaConfig, mockRouter);
  });

  describe("selectBestCycle function behavior", () => {
    const mockCycles = [
      {
        id: "cycle1",
        name: "Active Cycle 1",
        state: "active",
        start: "2024-01-01",
        delivery: "2024-01-01",
      },
      {
        id: "cycle2",
        name: "Active Cycle 2",
        state: "active",
        start: "2024-02-01",
        delivery: "2024-02-01",
      },
      {
        id: "cycle3",
        name: "Future Cycle 1",
        state: "planned",
        start: "2024-06-01",
        delivery: "2024-06-01",
      },
      {
        id: "cycle4",
        name: "Future Cycle 2",
        state: "planned",
        start: "2024-07-01",
        delivery: "2024-07-01",
      },
      {
        id: "cycle5",
        name: "Closed Cycle 1",
        state: "closed",
        start: "2023-12-01",
        delivery: "2023-12-01",
      },
      {
        id: "cycle6",
        name: "Closed Cycle 2",
        state: "completed",
        start: "2023-11-01",
        delivery: "2023-11-01",
      },
    ];

    test("should select oldest active cycle when available", async () => {
      mockCycleDataService.getAllCycles.mockResolvedValue(mockCycles);

      await store.dispatch("fetchCycles");

      const selectedCycle = store.state.selectedCycle;
      expect(selectedCycle.id).toBe("cycle1"); // Oldest active cycle
      expect(selectedCycle.state).toBe("active");
    });

    test("should select oldest future cycle when no active cycles", async () => {
      const futureOnlyCycles = mockCycles.filter(
        (cycle) => cycle.state === "planned",
      );
      mockCycleDataService.getAllCycles.mockResolvedValue(futureOnlyCycles);

      await store.dispatch("fetchCycles");

      const selectedCycle = store.state.selectedCycle;
      expect(selectedCycle.id).toBe("cycle3"); // Oldest future cycle
      expect(selectedCycle.state).toBe("planned");
    });

    test("should select oldest closed cycle when no active or future cycles", async () => {
      const closedOnlyCycles = mockCycles.filter(
        (cycle) => cycle.state === "closed" || cycle.state === "completed",
      );
      mockCycleDataService.getAllCycles.mockResolvedValue(closedOnlyCycles);

      await store.dispatch("fetchCycles");

      const selectedCycle = store.state.selectedCycle;
      expect(selectedCycle.id).toBe("cycle6"); // Oldest closed cycle
      expect(selectedCycle.state).toBe("completed");
    });

    test("should handle empty cycles array", async () => {
      mockCycleDataService.getAllCycles.mockResolvedValue([]);

      await store.dispatch("fetchCycles");

      const selectedCycle = store.state.selectedCycle;
      expect(selectedCycle).toBeNull();
    });

    test("should handle null cycles array", async () => {
      mockCycleDataService.getAllCycles.mockResolvedValue(null);

      await store.dispatch("fetchCycles");

      const selectedCycle = store.state.selectedCycle;
      expect(selectedCycle).toBeNull();
    });

    test("should handle cycles with missing dates gracefully", async () => {
      const cyclesWithMissingDates = [
        {
          id: "cycle1",
          name: "Cycle without dates",
          state: "active",
        },
        {
          id: "cycle2",
          name: "Cycle with start only",
          state: "active",
          start: "2024-01-01",
        },
      ];
      mockCycleDataService.getAllCycles.mockResolvedValue(
        cyclesWithMissingDates,
      );

      await store.dispatch("fetchCycles");

      const selectedCycle = store.state.selectedCycle;
      expect(selectedCycle).toBeDefined();
      expect(selectedCycle.state).toBe("active");
    });

    test("should prioritize active cycles over future cycles", async () => {
      const mixedCycles = [
        {
          id: "future1",
          name: "Future Cycle",
          state: "planned",
          start: "2024-01-01",
          delivery: "2024-01-01",
        },
        {
          id: "active1",
          name: "Active Cycle",
          state: "active",
          start: "2024-02-01",
          delivery: "2024-02-01",
        },
      ];
      mockCycleDataService.getAllCycles.mockResolvedValue(mixedCycles);

      await store.dispatch("fetchCycles");

      const selectedCycle = store.state.selectedCycle;
      expect(selectedCycle.id).toBe("active1");
      expect(selectedCycle.state).toBe("active");
    });

    test("should prioritize future cycles over closed cycles", async () => {
      const mixedCycles = [
        {
          id: "closed1",
          name: "Closed Cycle",
          state: "closed",
          start: "2023-01-01",
          delivery: "2023-01-01",
        },
        {
          id: "future1",
          name: "Future Cycle",
          state: "planned",
          start: "2024-01-01",
          delivery: "2024-01-01",
        },
      ];
      mockCycleDataService.getAllCycles.mockResolvedValue(mixedCycles);

      await store.dispatch("fetchCycles");

      const selectedCycle = store.state.selectedCycle;
      expect(selectedCycle.id).toBe("closed1");
      expect(selectedCycle.state).toBe("closed");
    });
  });

  describe("_ensureSelectedCycle action", () => {
    test("should not change cycle if one is already selected", async () => {
      const existingCycle = {
        id: "existing",
        name: "Existing Cycle",
        state: "active",
      };
      store.commit("SET_SELECTED_CYCLE", existingCycle);

      const cycleId = await store.dispatch("_ensureSelectedCycle");

      expect(cycleId).toBe("existing");
      expect(store.state.selectedCycle.id).toBe("existing");
    });

    test("should select best cycle when none is selected", async () => {
      const cycles = [
        {
          id: "cycle1",
          name: "Active Cycle",
          state: "active",
          start: "2024-01-01",
        },
        {
          id: "cycle2",
          name: "Future Cycle",
          state: "planned",
          start: "2024-06-01",
        },
      ];
      store.commit("SET_CYCLES", cycles);

      const cycleId = await store.dispatch("_ensureSelectedCycle");

      expect(cycleId).toBe("cycle1");
      expect(store.state.selectedCycle.id).toBe("cycle1");
    });

    test("should fetch cycles if none are available in state", async () => {
      const cycles = [
        {
          id: "cycle1",
          name: "Active Cycle",
          state: "active",
          start: "2024-01-01",
        },
      ];
      mockCycleDataService.getAllCycles.mockResolvedValue(cycles);

      const cycleId = await store.dispatch("_ensureSelectedCycle");

      expect(mockCycleDataService.getAllCycles).toHaveBeenCalled();
      expect(cycleId).toBe("cycle1");
      expect(store.state.selectedCycle.id).toBe("cycle1");
    });

    test("should handle error when fetching cycles fails", async () => {
      mockCycleDataService.getAllCycles.mockRejectedValue(
        new Error("Network error"),
      );

      const cycleId = await store.dispatch("_ensureSelectedCycle");

      expect(cycleId).toBeNull();
      expect(store.state.selectedCycle).toBeNull();
    });
  });
});
