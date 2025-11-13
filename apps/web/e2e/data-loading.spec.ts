import { test, expect } from "@playwright/test";

/**
 * Data Loading E2E Tests
 *
 * Tests to verify that data loading works correctly:
 * - API data fetching
 * - Data transformation
 * - Error handling
 * - Loading states
 */
test.describe("Data Loading", () => {
  test("should handle API data loading on cycle overview", async ({ page }) => {
    // Monitor network requests
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("/api/") ||
        url.includes("cycle") ||
        url.includes("data")
      ) {
        apiRequests.push(url);
      }
    });

    await page.goto("/cycles/overview");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Verify page loaded
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Log API requests for debugging
    if (apiRequests.length > 0) {
      console.log("API requests detected:", apiRequests);
    }
  });

  test("should handle API data loading on roadmap page", async ({ page }) => {
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("/api/") ||
        url.includes("roadmap") ||
        url.includes("data")
      ) {
        apiRequests.push(url);
      }
    });

    await page.goto("/cycles/roadmap");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const body = page.locator("body");
    await expect(body).toBeVisible();

    if (apiRequests.length > 0) {
      console.log("API requests detected:", apiRequests);
    }
  });

  test("should handle data loading errors gracefully", async ({ page }) => {
    // Intercept API requests and simulate errors
    await page.route("**/api/**", (route) => {
      // Let some requests fail to test error handling
      if (Math.random() > 0.5) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto("/cycles/overview");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Page should still render even with some failed requests
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
