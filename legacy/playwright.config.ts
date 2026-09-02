import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [["html", { outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
    headless: true,
  },
  projects: [
    { name: "setup", testMatch: "auth.setup.ts" },
    {
      name: "roombooking",
      testMatch: "roombooking-ui.spec.ts",
      dependencies: ["setup"],
    },
    {
      name: "slotrequests",
      testMatch: "slotrequests-ui.spec.ts",
      dependencies: ["setup"],
    },
    {
      name: "dashboard",
      testMatch: "dashboard-ui.spec.ts",
      dependencies: ["setup"],
    },
    {
      name: "register",
      testMatch: "register-ui.spec.ts",
      dependencies: ["setup"],
    },
    {
      name: "responsive",
      testMatch: "responsive-ui.spec.ts",
      dependencies: ["setup"],
      use: { storageState: "playwright/.auth/admin.json" },
    },
  ],
  webServer: {
    command: "bun run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
