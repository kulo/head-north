import {
  createAreaPredicate,
  createInitiativesPredicate,
  createStagesPredicate,
  createCyclePredicate,
  combinePredicates,
  createFilterPredicates,
} from "../predicate-filters";

describe("predicateFilters", () => {
  const mockReleaseItem = {
    id: "release1",
    name: "Release Item 1",
    area: "frontend",
    areaIds: ["frontend", "mobile"],
    initiativeId: 1,
    stage: "s1",
    cycleId: "cycle1",
    sprint: { id: "cycle1", name: "Sprint 1" },
  };

  describe("createAreaPredicate", () => {
    test("should return true for all items when no area is selected", () => {
      const predicate = createAreaPredicate(null);
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test('should return true for all items when area is "all"', () => {
      const predicate = createAreaPredicate("all");
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should match direct area property", () => {
      const predicate = createAreaPredicate("frontend");
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should match area from areaIds array", () => {
      const predicate = createAreaPredicate("mobile");
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should be case insensitive", () => {
      const predicate = createAreaPredicate("FRONTEND");
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should return false for non-matching area", () => {
      const predicate = createAreaPredicate("backend");
      expect(predicate(mockReleaseItem)).toBe(false);
    });
  });

  describe("createInitiativesPredicate", () => {
    test("should return true for all items when no initiatives are selected", () => {
      const predicate = createInitiativesPredicate(null);
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test('should return true for all items when "All" is selected', () => {
      const predicate = createInitiativesPredicate([
        { id: "all", name: "All Initiatives" },
      ]);
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should match initiative by initiativeId", () => {
      const predicate = createInitiativesPredicate([
        { id: 1, name: "Test Initiative" },
      ]);
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should return false for non-matching initiative", () => {
      const predicate = createInitiativesPredicate([
        { id: 2, name: "Other Initiative" },
      ]);
      expect(predicate(mockReleaseItem)).toBe(false);
    });

    test("should work with roadmap structure", () => {
      const roadmapItem = {
        initiatives: [{ initiativeId: 1, name: "Test Initiative" }],
      };
      const predicate = createInitiativesPredicate([
        { id: 1, name: "Test Initiative" },
      ]);
      expect(predicate(roadmapItem)).toBe(true);
    });
  });

  describe("createStagesPredicate", () => {
    test("should return true for all items when no stages are selected", () => {
      const predicate = createStagesPredicate(null);
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test('should return true for all items when "All" is selected', () => {
      const predicate = createStagesPredicate([
        { id: "all", name: "All Stages" },
      ]);
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should match stage by stage property", () => {
      const predicate = createStagesPredicate([{ id: "s1", name: "Stage 1" }]);
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should return false for non-matching stage", () => {
      const predicate = createStagesPredicate([{ id: "s2", name: "Stage 2" }]);
      expect(predicate(mockReleaseItem)).toBe(false);
    });
  });

  describe("createCyclePredicate", () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test("should return false for all items and log error when no cycle is selected", () => {
      const predicate = createCyclePredicate(null);
      expect(predicate(mockReleaseItem)).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "createCyclePredicate: No cycle provided. Client code must ensure a valid cycle is passed.",
      );
    });

    test('should return false for all items and log error when cycle is "all"', () => {
      const predicate = createCyclePredicate("all");
      expect(predicate(mockReleaseItem)).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "createCyclePredicate: Invalid cycle ID provided. Client code must ensure a valid cycle ID is passed.",
      );
    });

    test("should return false for all items and log error when cycle ID is empty", () => {
      const predicate = createCyclePredicate("");
      expect(predicate(mockReleaseItem)).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "createCyclePredicate: Invalid cycle ID provided. Client code must ensure a valid cycle ID is passed.",
      );
    });

    test("should match cycle by cycleId", () => {
      const predicate = createCyclePredicate("cycle1");
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should match cycle by cycle object", () => {
      const predicate = createCyclePredicate({ id: "cycle1", name: "Cycle 1" });
      expect(predicate(mockReleaseItem)).toBe(true);
    });

    test("should match cycle by sprint ID", () => {
      const itemWithSprintOnly = { ...mockReleaseItem, cycleId: null };
      const predicate = createCyclePredicate("cycle1");
      expect(predicate(itemWithSprintOnly)).toBe(true);
    });

    test("should return false for non-matching cycle", () => {
      const predicate = createCyclePredicate("cycle2");
      expect(predicate(mockReleaseItem)).toBe(false);
    });
  });

  describe("combinePredicates", () => {
    test("should combine multiple predicates with AND logic", () => {
      const predicate1 = (item) => item.area === "frontend";
      const predicate2 = (item) => item.stage === "s1";
      const combined = combinePredicates(predicate1, predicate2);

      expect(combined(mockReleaseItem)).toBe(true);
    });

    test("should return false if any predicate fails", () => {
      const predicate1 = (item) => item.area === "frontend";
      const predicate2 = (item) => item.stage === "s2";
      const combined = combinePredicates(predicate1, predicate2);

      expect(combined(mockReleaseItem)).toBe(false);
    });

    test("should work with no predicates", () => {
      const combined = combinePredicates();
      expect(combined(mockReleaseItem)).toBe(true);
    });
  });

  describe("createFilterPredicates", () => {
    test("should create composite predicates from filter configuration", () => {
      const filters = {
        area: "frontend",
        initiatives: [{ id: 1, name: "Test Initiative" }],
        stages: [{ id: "s1", name: "Stage 1" }],
        cycle: "cycle1",
      };

      const predicates = createFilterPredicates(filters);

      expect(typeof predicates.releaseItemPredicate).toBe("function");
      expect(typeof predicates.initiativePredicate).toBe("function");
      expect(predicates.releaseItemPredicate(mockReleaseItem)).toBe(true);
    });

    test("should handle empty filters", () => {
      const filters = {};
      const predicates = createFilterPredicates(filters);

      expect(predicates.releaseItemPredicate(mockReleaseItem)).toBe(true);
      expect(predicates.initiativePredicate(mockReleaseItem)).toBe(true);
    });

    test("should handle null filters", () => {
      const predicates = createFilterPredicates(null);

      expect(predicates.releaseItemPredicate(mockReleaseItem)).toBe(true);
      expect(predicates.initiativePredicate(mockReleaseItem)).toBe(true);
    });
  });
});
