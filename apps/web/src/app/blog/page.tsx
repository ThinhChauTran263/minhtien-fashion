import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blog");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export const revalidate = 120;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getPosts() {
  try {
    const res = await fetch(`${API_URL}/api/blog/posts?limit=12`, { next: { revalidate: 120 } });
    if (!res.ok) return { items: [] };
    const json = await res.json();
    return json.data;
  } catch {
    return { items: [] };
  }
}

export default async function BlogPage() {
  const t = await getTranslations("blog");
  const data = await getPosts();
  const posts = data?.items ?? [];

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
      <p className="text-gray-500 mb-8">{t("subtitle")}</p>

      {posts.length === 0 ? (
        <p className="text-gray-400 py-12 text-center">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="relative aspect-[16/9] bg-primary-50">
                <Image src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="(min-width:1024px) 33vw, 100vw" />
                {post.category && (
                  <span className="absolute top-2 left-2 bg-primary-800 text-white text-xs px-2 py-1 rounded">
                    {post.category.name}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <span>{post.author?.name}</span>
                  {post.readingTime && (
                    <span>â€¢ {t("readMins", { minutes: post.readingTime })}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

