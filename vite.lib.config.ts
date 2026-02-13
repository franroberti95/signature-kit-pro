import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

import dts from 'vite-plugin-dts';

export default defineConfig({
  envPrefix: "SIGNATURE_KIT_PRO_",
  plugins: [
    react(),
    dts({
      include: ['src'],
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: './tsconfig.lib.json',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/lib/index.ts"),
      name: "SignatureKitPro",
      formats: ["es", "umd"],
      fileName: (format) => `signature-kit-pro.${format === "es" ? "js" : "umd.cjs"}`,
    },
    rollupOptions: {
      // Externalize dependencies - these won't be bundled
      external: (id) => {
        // Always externalize React (peer dependencies)
        if (id === "react" || id === "react-dom") {
          return true;
        }

        // Externalize all backend dependencies
        if (
          id === "bcrypt" ||
          id === "jsonwebtoken" ||
          id === "@neondatabase/serverless" ||
          id === "@vercel/node" ||
          id === "dotenv" ||
          id.startsWith("@vercel/") ||
          id.startsWith("@neondatabase/")
        ) {
          return true;
        }

        // Externalize Node.js built-ins
        const nodeBuiltins = [
          "crypto", "fs", "path", "url", "http", "https",
          "stream", "util", "events", "buffer", "os", "zlib",
          "net", "tls", "dns", "querystring", "assert", "child_process"
        ];
        if (nodeBuiltins.includes(id)) {
          return true;
        }

        // Bundle everything else (frontend dependencies)
        return false;
      },
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
