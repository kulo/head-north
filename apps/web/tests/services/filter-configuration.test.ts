/**
 * Filter Configuration Service Tests
 * Unit tests for the filter configuration service functionality
 */

import { describe, it, expect, beforeEach } from "vitest";
import { HeadNorthConfig } from "@headnorth/config";
import { createFilterConfigurationService } from "../../src/services/filter-configuration";
import type { FilterKey, PageId } from "../../src/types/filter-types";

describe("Filter Configuration Service", () => {
  let filterConfig: ReturnType<typeof createFilterConfigurationService>;
  let headNorthConfig: HeadNorthConfig;

  beforeEach(() => {
    headNorthConfig = new HeadNorthConfig();
    filterConfig = createFilterConfigurationService(headNorthConfig);
  });

  describe("Factory Function", () => {
    it("should create filter configuration service", () => {
      expect(filterConfig).toBeDefined();
      expect(typeof filterConfig.getViewFilters).toBe("function");
      expect(typeof filterConfig.isCommonFilter).toBe("function");
      expect(typeof filterConfig.isValidFilterForView).toBe("function");
    });

    it("should validate page configuration matches HeadNorthConfig", () => {
      // The service validates that all pages in filter categories exist in HeadNorthConfig
      // Since DEFAULT_FILTER_CATEGORIES references pages that exist in default HeadNorthConfig,
      // this should succeed without throwing
      expect(() => {
        createFilterConfigurationService(headNorthConfig);
      }).not.toThrow();
    });
  });

  describe("getViewFilters", () => {
    it("should return filters for cycle-overview view", () => {
      const filters = filterConfig.getViewFilters("cycle-overview");

      expect(Array.isArray(filters)).toBe(true);
      expect(filters.length).toBeGreaterThan(0);
      // Should include common filters
      expect(filters).toContain("area");
      expect(filters).toContain("initiatives");
      expect(filters).toContain("showValidationErrors");
      // Should include view-specific filters
      expect(filters).toContain("stages");
      expect(filters).toContain("assignees");
      expect(filters).toContain("cycle");
    });

    it("should return filters for roadmap view", () => {
      const filters = filterConfig.getViewFilters("roadmap");

      expect(Array.isArray(filters)).toBe(true);
      // Should include common filters
      expect(filters).toContain("area");
      expect(filters).toContain("initiatives");
      expect(filters).toContain("showValidationErrors");
      // Should not include view-specific filters for cycle-overview
      expect(filters).not.toContain("stages");
      expect(filters).not.toContain("assignees");
      expect(filters).not.toContain("cycle");
    });

    it("should return filters for root view", () => {
      const filters = filterConfig.getViewFilters("root");

      expect(Array.isArray(filters)).toBe(true);
      // Root should only have common filters
      expect(filters).toContain("area");
      expect(filters).toContain("initiatives");
      expect(filters).toContain("showValidationErrors");
    });

    it("should return immutable copy of filters", () => {
      const filters1 = filterConfig.getViewFilters("cycle-overview");
      const filters2 = filterConfig.getViewFilters("cycle-overview");

      expect(filters1).toEqual(filters2);
      expect(filters1).not.toBe(filters2);
    });

    it("should combine common and view-specific filters", () => {
      const cycleFilters = filterConfig.getViewFilters("cycle-overview");
      const roadmapFilters = filterConfig.getViewFilters("roadmap");

      // Both should have common filters
      expect(cycleFilters).toContain("area");
      expect(roadmapFilters).toContain("area");

      // But cycle-overview should have more (view-specific)
      expect(cycleFilters.length).toBeGreaterThan(roadmapFilters.length);
    });
  });

  describe("isCommonFilter", () => {
    it("should return true for common filters", () => {
      expect(filterConfig.isCommonFilter("area")).toBe(true);
      expect(filterConfig.isCommonFilter("initiatives")).toBe(true);
      expect(filterConfig.isCommonFilter("showValidationErrors")).toBe(true);
    });

    it("should return false for view-specific filters", () => {
      expect(filterConfig.isCommonFilter("stages")).toBe(false);
      expect(filterConfig.isCommonFilter("assignees")).toBe(false);
      expect(filterConfig.isCommonFilter("cycle")).toBe(false);
    });

    it("should return false for unknown filter keys", () => {
      expect(filterConfig.isCommonFilter("unknown" as FilterKey)).toBe(false);
    });
  });

  describe("isValidFilterForView", () => {
    it("should return true for valid filters in cycle-overview", () => {
      expect(filterConfig.isValidFilterForView("area", "cycle-overview")).toBe(
        true,
      );
      expect(
        filterConfig.isValidFilterForView("stages", "cycle-overview"),
      ).toBe(true);
      expect(
        filterConfig.isValidFilterForView("assignees", "cycle-overview"),
      ).toBe(true);
      expect(filterConfig.isValidFilterForView("cycle", "cycle-overview")).toBe(
        true,
      );
    });

    it("should return true for valid filters in roadmap", () => {
      expect(filterConfig.isValidFilterForView("area", "roadmap")).toBe(true);
      expect(filterConfig.isValidFilterForView("initiatives", "roadmap")).toBe(
        true,
      );
      expect(
        filterConfig.isValidFilterForView("showValidationErrors", "roadmap"),
      ).toBe(true);
    });

    it("should return false for view-specific filters in wrong view", () => {
      expect(filterConfig.isValidFilterForView("stages", "roadmap")).toBe(
        false,
      );
      expect(filterConfig.isValidFilterForView("assignees", "roadmap")).toBe(
        false,
      );
      expect(filterConfig.isValidFilterForView("cycle", "roadmap")).toBe(false);
    });

    it("should return false for unknown filters", () => {
      expect(
        filterConfig.isValidFilterForView(
          "unknown" as FilterKey,
          "cycle-overview",
        ),
      ).toBe(false);
    });

    it("should return true for common filters in all views", () => {
      const views: PageId[] = ["root", "cycle-overview", "roadmap"];

      views.forEach((view) => {
        expect(filterConfig.isValidFilterForView("area", view)).toBe(true);
        expect(filterConfig.isValidFilterForView("initiatives", view)).toBe(
          true,
        );
        expect(
          filterConfig.isValidFilterForView("showValidationErrors", view),
        ).toBe(true);
      });
    });
  });

  describe("Immutability", () => {
    it("should not mutate view filters", () => {
      const filters1 = filterConfig.getViewFilters("cycle-overview");
      const originalLength = filters1.length;

      filters1.push("test" as FilterKey);

      const filters2 = filterConfig.getViewFilters("cycle-overview");
      expect(filters2.length).toBe(originalLength);
    });
  });

  describe("Consistency", () => {
    it("should have consistent filter validation", () => {
      // Test that isValidFilterForView is consistent with getViewFilters
      const views: PageId[] = ["root", "cycle-overview", "roadmap"];
      const allFilterKeys: FilterKey[] = [
        "area",
        "initiatives",
        "stages",
        "assignees",
        "cycle",
        "showValidationErrors",
      ];

      views.forEach((view) => {
        const viewFilters = filterConfig.getViewFilters(view);

        allFilterKeys.forEach((filterKey) => {
          const isValid = filterConfig.isValidFilterForView(filterKey, view);
          const isInViewFilters = viewFilters.includes(filterKey);

          // Consistency check: if filter is valid for view, it should be in view filters
          expect(isValid).toBe(isInViewFilters);
        });
      });
    });

    it("should have consistent common filter detection", () => {
      // Test that isCommonFilter is consistent with filter availability
      const commonFilters: FilterKey[] = [
        "area",
        "initiatives",
        "showValidationErrors",
      ];
      const viewSpecificFilters: FilterKey[] = ["stages", "assignees", "cycle"];

      commonFilters.forEach((filterKey) => {
        expect(filterConfig.isCommonFilter(filterKey)).toBe(true);
        // Common filters should be available in all views
        const views: PageId[] = ["root", "cycle-overview", "roadmap"];
        views.forEach((view) => {
          expect(filterConfig.isValidFilterForView(filterKey, view)).toBe(true);
        });
      });

      viewSpecificFilters.forEach((filterKey) => {
        expect(filterConfig.isCommonFilter(filterKey)).toBe(false);
      });
    });
  });
});
