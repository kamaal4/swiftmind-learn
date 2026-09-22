import type { NextConfig } from "next";

// GitHub Pages serves this as a project site from /swiftmind-learn/, so the build needs a
// base path. It is read from the environment rather than hardcoded, so a local build (and a
// future custom domain) can serve from the root with no code change.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  // Emits every route as <route>/index.html, which static hosts resolve unambiguously.
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
