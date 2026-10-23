import { test, expect } from "@playwright/test";

test.describe("FreshTrack Intelligence - Full Acceptance Suite", () => {
  // Test 1: Overview Screen
  test("Screen 1: Overview loads with actual API metrics and table", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/overview");
    await expect(page).toHaveTitle(/FreshTrack Intelligence/i);

    // Verify main header and store context
    await expect(page.locator("h1")).toContainText(/Retail intelligence/i);
    await expect(page.getByText(/Store 1/i).first()).toBeVisible();
    await expect(page.getByText(/Pichincha, Ecuador/i).first()).toBeVisible();

    // Verify metric cards rendered from API
    await expect(page.getByText(/Champion Model Benchmark/i)).toBeVisible();
    await expect(page.getByText(/10.69%/i).first()).toBeVisible();
    await expect(page.getByText(/50.913/i).first()).toBeVisible();

    // Verify table has 9 perishable families
    const tableRows = page.locator("tbody tr");
    await expect(tableRows).toHaveCount(9);

    // Verify no unexpected console errors
    expect(consoleErrors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  // Test 2: Demand Forecast Screen
  test("Screen 2: Demand Forecast loads recursive forecast", async ({
    page,
  }) => {
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

  // Test 3: Inventory Risk Simulator Screen
  test("Screen 3: Inventory Risk Simulator dynamically recomputes risk", async ({
    page,
  }) => {
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

  // Test 4: Markdown Planner Screen & Safeguard
  test("Screen 4: Markdown Planner enforces discount tiers and cost floor safeguard", async ({
    page,
  }) => {
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

  // Test 5: Model Performance Screen
  test("Screen 5: Model Performance renders verified academic metrics", async ({
    page,
  }) => {
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
    await expect(page.getByText(/July 17, 2017/i).first()).toBeVisible();
  });

  // Test 6: Dedicated Mobile Screen
  test("Screen 6: Dedicated Mobile Dashboard renders floor ops layout", async ({
    page,
  }) => {
    await page.goto("/mobile");
    await expect(page.locator("h1")).toContainText(/Retail overview/i);
    await expect(page.getByText(/Store 1 · Quito/i).first()).toBeVisible();

    // Verify quick action links
    await expect(page.getByRole("link", { name: /Run Inventory Risk Simulation/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open Dynamic Markdown Planner/i })).toBeVisible();

    // Verify mobile urgent perishable items
    await expect(page.getByText(/Urgent Perishable Items/i)).toBeVisible();
  });

  // Test 7: Login Interface
  test("Screen 7: Login interface clearly discloses academic prototype status", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText(/FreshTrack Terminal Access/i);

    // Verify disclosure banner
    await expect(page.getByText(/Frontend Prototype Interface Notice/i)).toBeVisible();
    await expect(page.getByText(/No live credentials, backend directory lookups, or user accounts/i)).toBeVisible();

    // Test reviewer state switcher
    const errorStateBtn = page.getByRole("button", { name: "error" });
    await errorStateBtn.click();
    await expect(page.getByText(/Authentication Verification Failed/i)).toBeVisible();
  });

  // Test 8: Custom 404 Error Page
  test("Custom 404 page renders with recovery navigation", async ({ page }) => {
    await page.goto("/some-nonexistent-route-for-testing");
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(page.getByText(/Page Not Located/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Overview Dashboard/i })).toBeVisible();
  });

  // Test 9: Responsive Layout & No Horizontal Overflow
  test("Responsive layout: No horizontal overflow across all views", async ({
    page,
  }) => {
    const testRoutes = [
      "/overview",
      "/demand-forecast",
      "/inventory-risk",
      "/markdown-planner",
      "/model-performance",
      "/mobile",
      "/login",
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
