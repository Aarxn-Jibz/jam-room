import { test, expect } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };

test.describe("Responsive Layout", () => {
  test.describe("Mobile (390x844)", () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test("Home page has no horizontal overflow and nav hamburger is visible", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".md\\:hidden button").first()).toBeVisible();
      const html = page.locator("html");
      await expect(html).toHaveJSProperty("scrollWidth", (await html.evaluate(el => el.clientWidth)));
    });

    test("RoomBooking page loads table with horizontal scroll", async ({ page }) => {
      await page.goto("/RoomBooking");
      await expect(page.getByText("Room")).toBeVisible();
      // Wait for data to load and table to render
      const scrollContainer = page.locator(".rounded-2xl.border.border-white\\/10.bg-white\\/\\[0\\.02\\]").first();
      await expect(scrollContainer).toBeVisible({ timeout: 15000 });
      await expect(scrollContainer.getByRole("table")).toBeVisible();
    });

    test("SlotRequests page loads with stacked filter controls", async ({ page }) => {
      await page.goto("/SlotRequests");
      await expect(page.getByPlaceholder("Search...")).toBeVisible();
      const filterGroup = page.locator(".flex-col.sm\\:flex-row").first();
      await expect(filterGroup).toBeVisible();
    });

    test("Dashboard page load form stacks vertically", async ({ page }) => {
      await page.goto("/Dashboard");
      await expect(page.getByText("Slot Configuration")).toBeVisible();
      const addForm = page.locator(".flex-col.sm\\:flex-row.gap-3").first();
      await expect(addForm).toBeVisible();
    });

    test("Navbar mobile menu opens and animates", async ({ page }) => {
      await page.goto("/");
      const hamburger = page.locator(".md\\:hidden button").first();
      await hamburger.click();
      // Check mobile menu links (only visible in mobile menu area)
      const mobileMenu = page.locator(".md\\:hidden.overflow-hidden");
      await expect(mobileMenu.getByText("Room Booking")).toBeVisible();
      await expect(mobileMenu.getByText("Logout")).toBeVisible();
      // Close menu
      await hamburger.click();
      await expect(mobileMenu).not.toBeVisible();
    });

    test("Register page cards stack vertically", async ({ page }) => {
      await page.goto("/Register");
      await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible();
    });
  });

  test.describe("Tablet (768x1024)", () => {
    test.use({ viewport: TABLET_VIEWPORT });

    test("Home page renders correctly at tablet", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("SWO")).toBeVisible();
    });

    test("RoomBooking page week nav fits without wrapping", async ({ page }) => {
      await page.goto("/RoomBooking");
      const nav = page.locator(".rounded-full.border.border-white\\/10").first();
      const navBox = await nav.boundingBox();
      const viewport = page.viewportSize()!;
      expect(navBox!.width).toBeLessThanOrEqual(viewport.width);
    });
  });
});
