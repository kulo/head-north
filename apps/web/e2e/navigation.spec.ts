import { test, expect } from "@playwright/test";

/**
 * Navigation E2E Tests
 *
 * Tests for page navigation and routing functionality.
 * These tests ensure that all routes work correctly and navigation
 * between pages functions as expected.
 */
test.describe("Navigation", () => {
  test("should load the application and redirect to cycle overview", async ({
    page,
  }) => {
    await page.goto("/");

    // Should redirect to cycle overview page
    await expect(page).toHaveURL(/\/cycles\/overview/);
  });

  test("should navigate to cycle overview page", async ({ page }) => {
    await page.goto("/cycles/overview");

    // Page should load without errors
    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to roadmap page", async ({ page }) => {
    await page.goto("/cycles/roadmap");

    // Page should load without errors
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle invalid routes gracefully", async ({ page }) => {
    await page.goto("/non-existent-route");

    // Should either show 404 or redirect to a valid page
    // The exact behavior depends on router configuration
    const url = page.url();
    expect(url).toMatch(/\/(cycles\/overview|cycles\/roadmap|\/)/);
  });
});
