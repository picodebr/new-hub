import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "next/image": path.resolve(__dirname, "./src/_base/compat/next-image.tsx"),
      "next/dynamic": path.resolve(__dirname, "./src/_base/compat/next-dynamic.tsx"),
      "next/router": path.resolve(__dirname, "./src/_base/compat/next-router.tsx"),
      "next/head": path.resolve(__dirname, "./src/_base/compat/next-head.tsx"),
      "next/link": path.resolve(__dirname, "./src/_base/compat/next-link.tsx"),
      "next/server": path.resolve(__dirname, "./src/_base/compat/next-server.ts"),
      "next/script": path.resolve(__dirname, "./src/_base/compat/next-script.tsx"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  optimizeDeps: {
    include: ["paper"],
  },
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],

  define: {
    'process.env': 'import.meta.env',
  },
}));
