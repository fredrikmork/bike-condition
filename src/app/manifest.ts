import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bike Condition",
    short_name: "Bike Condition",
    description:
      "Track your bike component wear and know when it's time for maintenance",
    start_url: "/",
    display: "standalone",
    background_color: "#2a2a2a",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
