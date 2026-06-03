import type { MetadataRoute } from "next";
import { serverApi } from "@/lib/server-api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const revalidate = 3600; // ISR má»—i giá»

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/ao-co-co`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/ao-co-tron`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/combo`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/gift-cards`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/guides/size`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/guides/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/guides/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Dynamic product routes
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const items = await serverApi.getAllProductSlugs();
    productRoutes = items.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // silent - fallback to static only
  }

  // Dynamic blog routes
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${API_URL}/api/blog/posts?limit=200`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      blogRoutes = (json.data?.items ?? []).map((p: any) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // silent
  }

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}

