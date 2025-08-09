import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PERSONAL FIT",
    short_name: "PERSONAL FIT",
    description: "Professional personal training management platform with role-based access",
    start_url: "/",
    display: "standalone",
    background_color: "#454545",
    theme_color: "#FF6000",
    orientation: "portrait",
    icons: [
    ],
    categories: ["fitness", "health", "productivity"],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  }
}


{/* EST0 IBA ARRIBA, AVERIGUAR PARA QUE SIRVE!!! TIRABA WARNINGS !!!!
      icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  
  */}