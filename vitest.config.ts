import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    setupFiles: ["./src/server/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["html", "text-summary"],
      reportsDirectory: "coverage",
      // ignore structural or no-op files like barrel exports and type-only modules
      exclude: [
        "**/index.ts",
        "**/index.{js,ts}",
        "**/*.d.ts",
        "**/*.type.ts",
        "**/*.types.ts",
        "**/*.{spec,test}.{js,ts,jsx,tsx}",
      ],

      clean: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
