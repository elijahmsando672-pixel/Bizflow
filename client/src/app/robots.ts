import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
    : "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: ["/dashboard/", "/api/", "/users/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
