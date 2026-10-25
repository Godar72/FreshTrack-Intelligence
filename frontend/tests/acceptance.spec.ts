import { test, expect, Page } from "@playwright/test";

// Helper to authenticate session as Store Operations Manager
async function authenticateOperator(page: Page) {
  await page.goto("/login");
  await page.locator("#operator-email").fill("manager@freshtrack.retail");
  await page.locator("#operator-password").fill("FreshTrack2026!");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/overview", { timeout: 15000 });
}

test.describe("FreshTrack Intelligence - Retail Application Acceptance Suite", () => {
  // Test 1: Authentication Requirement on Root
  test("Auth 1: Unauthenticated visitor to / is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForURL("**/login", { timeout: 10000 });
    await expect(page.locator("h1")).toContainText(/Sign In to FreshTrack/i);
    await expect(page.locator("#operator-email")).toBeVisible();
    await expect(page.locator("#operator-password")).toBeVisible();
  });

  // Test 2: Protected Route Enforcement
  test("Auth 2: Direct unauthenticated visit to /overview is blocked and redirected to /login", async ({
    page,
  }) => {
    await page.goto("/overview");
    await page.waitForURL(/login\?redirect=%2Foverview/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText(/Sign In to FreshTrack/i);
  });

  // Test 3: Failed Login Feedback
  test("Auth 3: Invalid login credentials show clear error message", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#operator-email").fill("invalid@retailer.com");
    await page.locator("#operator-password").fill("WrongPassword123!");
    await page.locator('button[type="submit"]').click();

    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/Authentication Failed/i);
  });

  // Test 4: Successful Login & Redirect
  test("Auth 4: Valid login authenticates and redirects to Overview", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#operator-email").fill("manager@freshtrack.retail");
    await page.locator("#operator-password").fill("FreshTrack2026!");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/overview", { timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/Retail intelligence/i);
    await expect(page.getByText(/Store 1 · Quito/i).first()).toBeVisible();
  });

  // Test 5: Session Persistence Across Reload
  test("Auth 5: Authenticated session persists across page reloads", async ({
    page,
  }) => {
    await authenticateOperator(page);
    await page.reload();
    await expect(page.locator("h1")).toContainText(/Retail intelligence/i);
    expect(page.url()).toContain("/overview");
  });

  // Test 6: Logout Returns to Login
  test("Auth 6: Sign out terminates session and redirects to /login", async ({
    page,
  }) => {
    await authenticateOperator(page);
    const signOutBtn = page.getByRole("button", { name: /Sign out/i }).first();
    await signOutBtn.click();
    await page.waitForURL("**/login", { timeout: 10000 });
    await expect(page.locator("h1")).toContainText(/Sign In to FreshTrack/i);

    // Verify cannot re-access protected overview without login
    await page.goto("/overview");
    await page.waitForURL("**/login?redirect=%2Foverview", { timeout: 10000 });
  });

  // Test 7: Overview Screen (Authenticated)
  test("Screen 1: Overview loads with verified metrics and 9 perishable families", async ({
    page,
  }) => {
    await authenticateOperator(page);

    // Verify main header and store context
    await expect(page.locator("h1")).toContainText(/Retail intelligence/i);
    await expect(page.getByText(/Store 1 · Quito/i).first()).toBeVisible();

    // Verify metric cards
    await expect(page.getByText(/Forecast Model Performance/i)).toBeVisible();
    await expect(page.getByText(/10.69%/i).first()).toBeVisible();
    await expect(page.getByText(/50.913/i).first()).toBeVisible();

    // Verify table has 9 perishable families
    const tableRows = page.locator("tbody tr");
    await expect(tableRows).toHaveCount(9);
  });

  // Test 8: Demand Forecast Screen
  test("Screen 2: Demand Forecast loads recursive forecast with category selection", async ({
    page,
  }) => {
    await authenticateOperator(page);
    await page.goto("/demand-forecast");
    await expect(page.locator("h1")).toContainText(/Perishable Demand Forecast/i);

    // Verify origin date marker
    await expect(page.getByText(/Forecast Origin Date/i)).toBeVisible();
    await expect(page.getByText(/2017-07-16/i).first()).toBeVisible();

    // Check family selector
    const familySelect = page.locator("select").first();
    await expect(familySelect).toHaveValue("PRODUCE");

    // Change family to DAIRY
    await familySelect.selectOption("DAIRY");
    await expect(familySelect).toHaveValue("DAIRY");

    // Wait for the recursive forecast table rows to be populated from API
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 15000 });
    const count = await page.locator("table tbody tr").count();
    expect(count).toBeGreaterThanOrEqual(14);
  });

  // Test 9: Inventory Risk Simulator Screen
  test("Screen 3: Inventory Risk Simulator dynamically recomputes risk", async ({
    page,
  }) => {
    await authenticateOperator(page);
    await page.goto("/inventory-risk");
    await expect(page.locator("h1")).toContainText(/Perishable Inventory Risk Simulation/i);

    // Check configuration cues
    await expect(page.getByText(/Starting Inventory \(User Input\)/i)).toBeVisible();

    // Verify initial calculation
    await expect(page.getByText(/Expected Surplus/i).first()).toBeVisible();

    // Select 2 Days shelf life button
    const twoDaysBtn = page.getByRole("button", { name: "2 Days" });
    await twoDaysBtn.click();

    // Click Run Inventory Simulation
    const runBtn = page.getByRole("button", { name: /Run Inventory Simulation/i });
    await runBtn.click();
    await page.waitForTimeout(600);

    // Verify terminal balance displays
    await expect(page.getByText(/surplus units/i).first()).toBeVisible();
  });

  // Test 10: Markdown Planner Screen & Safeguard
  test("Screen 4: Markdown Planner enforces discount tiers and cost floor safeguard", async ({
    page,
  }) => {
    await authenticateOperator(page);
    await page.goto("/markdown-planner");
    await expect(page.locator("h1")).toContainText(/Dynamic Markdown Decision Planner/i);

    // Verify cost floor equation display
    await expect(page.getByText(/Cost Floor Governing Equation/i)).toBeVisible();

    // Verify decision pricing display
    await expect(page.getByText(/Recommended Decision Price/i)).toBeVisible();

    // Verify cost floor violation protection card
    await expect(page.getByText(/Cost Floor Violation Prevented/i)).toBeVisible();
    await expect(page.getByText(/Clamped Safe Minimum Price/i)).toBeVisible();
  });

  // Test 11: Model Performance Screen
  test("Screen 5: Model Performance renders verified performance metrics", async ({
    page,
  }) => {
    await authenticateOperator(page);
    await page.goto("/model-performance");
    await expect(page.locator("h1")).toContainText(/Model Performance & Validation/i);

    // Check exact reported validation metrics from Kaggle Store Sales benchmark
    await expect(page.getByText(/50.913/i).first()).toBeVisible(); // MAE
    await expect(page.getByText(/103.876/i).first()).toBeVisible(); // RMSE
    await expect(page.getByText(/10.69%/i).first()).toBeVisible(); // HGB WAPE

    // Check benchmark comparisons
    await expect(page.getByText(/11.29%/i).first()).toBeVisible(); // RF WAPE
    await expect(page.getByText(/13.08%/i).first()).toBeVisible(); // Ridge WAPE
    await expect(page.getByText(/14.56%/i).first()).toBeVisible(); // Baseline WAPE

    // Check holdout specification
    await expect(page.getByText(/270 samples/i).first()).toBeVisible();
  });

  // Test 12: Mobile Dashboard Option Absent from Navigation
  test("Navigation 1: Mobile Dashboard item is absent from navigation", async ({
    page,
  }) => {
    await authenticateOperator(page);
    const navBar = page.locator("nav");
    await expect(navBar.getByText(/Mobile Dashboard/i)).toHaveCount(0);
    await expect(navBar.getByText(/Terminal Login/i)).toHaveCount(0);
  });

  // Test 13: Automatic Responsive Navigation Layout
  test("Navigation 2: Automatic responsive layout adapts to viewport", async ({
    page,
  }) => {
    await authenticateOperator(page);
    const viewportSize = page.viewportSize();

    if (viewportSize && viewportSize.width >= 1024) {
      // Desktop: Aside sidebar is visible
      await expect(page.locator("aside[aria-label='Main Navigation']")).toBeVisible();
      // Mobile bottom bar is hidden
      await expect(page.locator("nav[aria-label='Mobile Navigation Bar']")).toBeHidden();
    } else {
      // Mobile / Tablet: Bottom bar is visible
      await expect(page.locator("nav[aria-label='Mobile Navigation Bar']")).toBeVisible();
    }
  });

  // Test 14: Custom 404 Error Page
  test("Navigation 3: Custom 404 page renders with recovery navigation", async ({
    page,
  }) => {
    await page.goto("/some-nonexistent-route-for-testing");
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(page.getByText(/Page Not Located/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Overview Dashboard/i })).toBeVisible();
  });

  // Test 15: Responsive Layout & No Horizontal Overflow
  test("Responsive: No horizontal overflow across all application routes", async ({
    page,
  }) => {
    await authenticateOperator(page);
    const testRoutes = [
      "/overview",
      "/demand-forecast",
      "/inventory-risk",
      "/markdown-planner",
      "/model-performance",
    ];

    for (const route of testRoutes) {
      await page.goto(route);
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    }
  });
});
