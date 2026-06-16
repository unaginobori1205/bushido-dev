import type { MetadataRoute } from "next";

// TODO(domain): keep in sync with SITE_URL in app/layout.tsx.
const SITE_URL = "https://bushido.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
