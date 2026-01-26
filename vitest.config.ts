import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html", "lcov"],
            exclude: [
                "node_modules/",
                ".next/",
                "coverage/",
                "**/*.config.{js,ts}",
                "**/types.ts",
                "**/*.d.ts",
                "__tests__/",
                "vitest.setup.ts",
            ],
            include: ["app/**/*.ts", "app/**/*.tsx", "lib/**/*.ts"],
        },
        env: {
            MEM0_API_KEY: "test-mem0-key",
            GOOGLE_API_KEY: "test-google-key",
            QDRANT_URL: "http://localhost:6333",
            TAVILY_API_KEY: "test-tavily-key",
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});
