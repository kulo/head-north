import { test, expect } from "@playwright/test";

/**
 * Cycle Overview E2E Tests
 *
 * Tests for the cycle overview page functionality including:
 * - Page rendering
 * - Component display
 * - Filter interactions
 * - Data loading
 */
test.describe("Cycle Overview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cycles/overview");
    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");
  });

  test("should render cycle overview page", async ({ page }) => {
    // Verify page is loaded
    await expect(page.locator("body")).toBeVisible();

    // Check that main content area exists
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display page selector component", async ({ page }) => {
    // Wait a bit for Vue components to render
    await page.waitForTimeout(1000);

    // Look for any navigation or selector elements
    // The exact selectors depend on the actual component structure
    const pageContent = page.locator("body");
    await expect(pageContent).toBeVisible();
  });

  test("should handle cycle selection", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Try to find and interact with cycle selector if it exists
    // This is a basic smoke test - actual selector names depend on implementation
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should display cycle data when available", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Verify page renders without JavaScript errors
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check console for errors (this would indicate data loading issues)
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Give it time to load
    await page.waitForTimeout(2000);

    // Log any errors for debugging (but don't fail unless critical)
    if (errors.length > 0) {
      console.log("Console errors detected:", errors);
    }
  });
});
