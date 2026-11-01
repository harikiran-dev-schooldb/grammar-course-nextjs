import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grammar Studio — English & Telugu",
    short_name: "Grammar Studio",
    description: "A 30-day bilingual course for grammar, listening, reading, writing, speaking, vocabulary, and translation.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f0e6",
    theme_color: "#15384a",
    orientation: "any",
    lang: "en-IN",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
