import type { NextConfig } from "next";

// Cloudflare serves the export from the domain root, so no base path is set there. A host
// that serves it from a sub-path (e.g. a GitHub Pages project site at /swiftmind-learn/)
// sets NEXT_PUBLIC_BASE_PATH at build time; nothing else changes.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  // Emits every route as <route>/index.html, which static hosts resolve unambiguously.
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
