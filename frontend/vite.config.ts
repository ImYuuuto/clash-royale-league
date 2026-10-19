import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";
import tailwindcss from "@tailwindcss/vite"
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const backendEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../backend/.env");
let backendPort = process.env.PORT || "4000";
try {
  const portLine = readFileSync(backendEnvPath, "utf8").match(/^\s*PORT\s*=\s*["']?(\d+)/m);
  if (portLine?.[1]) backendPort = portLine[1];
} catch {
  // Use the backend's default port when no local .env file exists.
}

// https://vite.dev/config/
export default defineConfig({
  // Electron loads the production page from file://, so generated assets must
  // resolve relative to dist/index.html rather than the filesystem root.
  base: "./",
  server: {
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    plugins: ["react", "typescript", "oxc"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  plugins: lazyPlugins(() => [react(), 
    tailwindcss(),
  ]),
});
