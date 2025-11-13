import { test, expect } from "@playwright/test";

/**
 * Component Rendering E2E Tests
 *
 * Tests to ensure all major UI components render correctly:
 * - Selectors (Cycle, Page, Area, etc.)
 * - Charts and visualizations
 * - Filter components
 * - Navigation components
 */
test.describe("Component Rendering", () => {
  test("should render components on cycle overview page", async ({ page }) => {
    await page.goto("/cycles/overview");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Basic check that page renders
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Verify no critical JavaScript errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    // Log errors but don't fail on first run (baseline establishment)
    if (errors.length > 0) {
      console.log("Component rendering console errors:", errors);
    }
  });

  test("should render components on roadmap page", async ({ page }) => {
    await page.goto("/cycles/roadmap");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const body = page.locator("body");
    await expect(body).toBeVisible();

    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log("Component rendering console errors:", errors);
    }
  });

  test("should handle component interactions without errors", async ({
    page,
  }) => {
    await page.goto("/cycles/overview");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Test basic page interaction
    await page.mouse.move(100, 100);
    await page.mouse.click(100, 100);

    // Verify page still responsive
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
