import { defineConfig } from "vitest/config";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["src/test/**/*.test.{ts,tsx}"],
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "src/**/*.stories.tsx",
        "src/**/*.d.ts",
        "dist/",
        "*.config.*",
        "scripts/",
      ],
      // The 80% gate is applied to merged unit/browser coverage by merge-coverage.mjs.
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
