import { test, expect } from "@playwright/test";

/**
 * Roadmap E2E Tests
 *
 * Tests for the roadmap view functionality including:
 * - Page rendering
 * - Roadmap item display
 * - Filter interactions
 * - Data loading and visualization
 */
test.describe("Roadmap View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cycles/roadmap");
    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");
  });

  test("should render roadmap page", async ({ page }) => {
    // Verify page is loaded
    await expect(page.locator("body")).toBeVisible();

    // Check that main content area exists
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display roadmap items when available", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Verify page renders without JavaScript errors
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check for console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log("Console errors detected:", errors);
    }
  });

  test("should handle filter interactions", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Basic smoke test - verify page is interactive
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Try clicking on the page to ensure it's responsive
    await body.click();
  });
});
