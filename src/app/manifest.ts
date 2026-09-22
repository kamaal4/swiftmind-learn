import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Manifest URLs are literal strings, so unlike next/link they do not pick up basePath.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SwiftMind — learn iOS and Swift",
    short_name: "SwiftMind",
    description:
      "Structured concepts, quizzes, interview prep and spaced repetition for iOS developers. Works offline.",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#F7F7F9",
    theme_color: "#4B3BEB",
    icons: [
      { src: `${base}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png" },
      {
        src: `${base}/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
