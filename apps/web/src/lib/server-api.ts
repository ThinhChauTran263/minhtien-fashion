/**
 * Server-side fetch helpers cho RSC (React Server Components).
 * DÃ¹ng `fetch` chuáº©n Ä‘á»ƒ Next.js cÃ³ thá»ƒ táº­n dá»¥ng cache + ISR.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface FetchOptions {
  /** ISR revalidate seconds; máº·c Ä‘á»‹nh 60s */
  revalidate?: number;
  /** Tags Ä‘á»ƒ revalidateTag() */
  tags?: string[];
  /** Force no cache */
  noStore?: boolean;
}

async function fetchJson<T = any>(path: string, opts: FetchOptions = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      next: opts.noStore
        ? undefined
        : { revalidate: opts.revalidate ?? 60, tags: opts.tags },
      cache: opts.noStore ? "no-store" : undefined,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch (err) {
    console.error(`[server-api] ${path}`, err);
    return null;
  }
}

export const serverApi = {
  getFeaturedProducts: () => fetchJson("/products/featured", { revalidate: 60 }),
  getNewArrivals: () => fetchJson("/products/new-arrivals", { revalidate: 60 }),
  getProducts: (params: Record<string, string | number | undefined> = {}) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    return fetchJson<{
      items: any[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/products${qs ? `?${qs}` : ""}`, { revalidate: 30 });
  },
  getProductBySlug: (slug: string) =>
    fetchJson(`/products/${slug}`, { revalidate: 60, tags: [`product:${slug}`] }),
  getSizeGuide: (categoryId?: string) => {
    const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
    return fetchJson(`/size-guide${qs}`, { revalidate: 300 });
  },
  getRelatedProducts: (id: string, limit = 8) =>
    fetchJson(`/products/${id}/related?limit=${limit}`, { revalidate: 60, tags: [`related:${id}`] }),
  getCategories: () => fetchJson("/categories", { revalidate: 300 }),
  getBanners: (position?: string) => {
    const qs = position ? `?position=${encodeURIComponent(position)}` : "";
    return fetchJson(`/banners${qs}`, { revalidate: 300 });
  },
  getReviews: (slug: string) =>
    fetchJson(`/reviews/products/${slug}?page=1&limit=5`, {
      revalidate: 60,
      tags: [`reviews:${slug}`],
    }),
  /** Láº¥y slug cá»§a táº¥t cáº£ sáº£n pháº©m cho generateStaticParams + sitemap */
  getAllProductSlugs: async () => {
    const res = await fetchJson<{ items: Array<{ slug: string; updatedAt?: string }> }>(
      "/products?limit=200",
      { revalidate: 600 }
    );
    return res?.items ?? [];
  },
};

