import type { MetadataRoute } from "next";

// The API lives on the same origin as the app on Vercel, so the site URL can be a
// relative "/api" value, an absolute API URL, or nothing at all.
const siteUrl = () => {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/+$/, "");
  if (configured.startsWith("http")) return configured;
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
};

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl();

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
