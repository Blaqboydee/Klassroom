import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://klassroom.cv";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/dashboard", "/admin", "/api/", "/live"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
