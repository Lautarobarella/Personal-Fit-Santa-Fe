import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PERSONAL FIT Santa Fe",
    short_name: "PERSONAL FIT",
    description: "Professional personal training management platform with role-based access",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#454545",
    theme_color: "#FF6000",
    orientation: "portrait",
    lang: "es",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["fitness", "health", "productivity"],
  }
}