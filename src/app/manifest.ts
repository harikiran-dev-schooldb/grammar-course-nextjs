import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grammar Studio — English & Telugu",
    short_name: "Grammar Studio",
    description: "A complete bilingual English-learning app from phonics and first words to advanced speaking, reading, writing, grammar, and vocabulary.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f5fa",
    theme_color: "#091540",
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
