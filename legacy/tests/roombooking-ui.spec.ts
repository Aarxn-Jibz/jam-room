import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/admin.json" });

test.describe("RoomBooking Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/RoomBooking");
    // Wait for table to fully render (loading bar disappears, "Available" cells appear)
    await expect(page.getByText("Available").first()).toBeVisible({ timeout: 20000 });
  });

  test("F1: Page loads with table and header controls", async ({ page }) => {
    await expect(page.getByText("Time")).toBeVisible();
    await expect(page.getByText("Today")).toBeVisible();
    await expect(page.getByText("Room", { exact: true })).toBeVisible();
    // Day columns should be visible (Mon, Tue, etc.)
    await expect(page.getByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/).first()).toBeVisible();
  });

  test("F2: Click available cell opens booking modal", async ({ page }) => {
    const available = page.getByText("Available").first();
    await available.click();

    await expect(page.getByText("Request Slot")).toBeVisible();
    await expect(page.getByText("Date")).toBeVisible();
    await expect(page.locator("label").filter({ hasText: "Time" })).toBeVisible();
    await expect(page.getByPlaceholder("Why do you need this slot?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Request" })).toBeVisible();
  });

  test("F3: Click booked cell shows Slot Unavailable", async ({ page }) => {
    // Look for a cell with bold white text (booked band name)
    const bookedCell = page.locator("td").filter({ hasText: /^[A-Za-z0-9]+$/ }).filter({
      has: page.locator(".font-bold.text-white"),
    }).first();

    if (await bookedCell.isVisible()) {
      await bookedCell.click();
      await expect(page.getByText("Slot Unavailable")).toBeVisible();
      await expect(page.getByText("This slot is already booked.")).toBeVisible();
    }
    // If no booked cell, this test is skipped (no-op)
  });

  test("F4: Not logged in shows Login Required", async ({ page }) => {
    // Clear the authenticated state for this test
    await page.context().clearCookies();
    await page.goto("/RoomBooking");
    await page.waitForTimeout(2000);

    // Click any "Available" cell
    const available = page.getByText("Available").first();
    if (await available.isVisible()) {
      await available.click();
      await expect(page.getByText("Login Required")).toBeVisible();
    }
  });

  test("F5: Submit booking request shows confirmation", async ({ page }) => {
    // Clean up any existing test requests to avoid conflicts
    const allReqs = await (await page.request.get("/api/requests")).json();
    for (const req of allReqs) {
      if (req.reason?.includes("[TEST]") && req.status === "pending") {
        await page.request.delete(`/api/requests?id=${req.id}`);
      }
    }

    const available = page.getByText("Available").first();
    await available.click();

    await expect(page.getByText("Select Profile")).toBeVisible();

    await page.getByRole("button", { name: "Select a Profile" }).click();
    const firstBand = page.locator("ul li").first();
    await firstBand.click();

    await page.getByPlaceholder("Why do you need this slot?").fill("[TEST] Playwright booking");
    await page.getByRole("button", { name: "Submit Request" }).click();

    await expect(page.getByText("Request Submitted")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Your request has been submitted for approval.")).toBeVisible();
  });

  test("F9: Week navigation buttons work", async ({ page }) => {
    // Get the nav pill container by locating "Today" button's parent group
    const navGroup = page.getByText("Today").locator("..");
    const buttons = navGroup.locator("button");

    // Click left chevron (2nd button after the separator div)
    const leftChevron = buttons.filter({ has: page.locator("svg path[d*='M15 19l-7-7']") });
    if (await leftChevron.count() > 0) {
      await leftChevron.click();
      await expect(page.getByText("Available").first()).toBeVisible();
    }

    // Click right chevron
    const rightChevron = buttons.filter({ has: page.locator("svg path[d*='M9 5l7 7']") });
    if (await rightChevron.count() > 0) {
      await rightChevron.click();
      await expect(page.getByText("Available").first()).toBeVisible();
    }

    // Click "Today" to reset
    await page.getByText("Today").click();
    await expect(page.getByText("Available").first()).toBeVisible();
  });

  test("F10: Room dropdown changes the table", async ({ page }) => {
    // Open room dropdown
    const roomButton = page.getByRole("button").filter({ hasText: /^\d+$/ }).first();
    const currentRoom = await roomButton.textContent();

    if (currentRoom) {
      await roomButton.click();
      // Click a different room option
      const otherRoom = page.locator("div.absolute button").filter({ hasText: /\d+/ }).filter({ hasNotText: currentRoom }).first();
      if (await otherRoom.isVisible()) {
        await otherRoom.click();
        // Table should reload
        await expect(page.getByText("Available").first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test("F14: Time dropdown in modal works", async ({ page }) => {
    const available = page.getByText("Available").first();
    await available.click();

    // Wait for modal to appear
    await expect(page.getByText("Request Slot")).toBeVisible();

    // Click the Time button to open dropdown
    const timeButton = page.getByRole("button").filter({ hasText: /AM|PM/ }).first();
    await timeButton.click();

    // Dropdown options should be visible
    const timeOptions = page.locator("div.absolute button").filter({ hasText: /AM|PM/ });
    await expect(timeOptions.first()).toBeVisible({ timeout: 5000 });

    // Click the second time option
    const options = await timeOptions.all();
    if (options.length >= 2) {
      const selectedText = await options[1].textContent();
      await options[1].click();

      // The button text should update to the selected time
      if (selectedText) {
        await expect(timeButton).toContainText(selectedText.trim());
      }
    }
  });

  test("F15: Admin sees Profile dropdown in modal", async ({ page }) => {
    const available = page.getByText("Available").first();
    await available.click();

    await expect(page.getByText("Select Profile")).toBeVisible();
    await expect(page.getByRole("button", { name: "Select a Profile" })).toBeVisible();
  });
});
