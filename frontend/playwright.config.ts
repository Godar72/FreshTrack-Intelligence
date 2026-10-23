import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "off",
  },
  projects: [
    {
      name: "desktop-1440",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "laptop-1280",
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "tablet-768",
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "mobile-430",
      use: {
        viewport: { width: 430, height: 932 },
      },
    },
    {
      name: "mobile-390",
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "mobile-360",
      use: {
        viewport: { width: 360, height: 740 },
      },
    },
  ],
});
