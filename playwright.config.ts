import { defineConfig } from "playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort --open false",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
