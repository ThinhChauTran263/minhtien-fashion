import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { toNumber } from "@/lib/customer-utils";
import { getTranslations } from "next-intl/server";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ReviewSection } from "@/components/product/review-section";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { TrackRecentlyViewed } from "@/components/product/track-recently-viewed";
import { RelatedProducts } from "@/components/product/related-products";

interface PageProps {
  params: { slug: string };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateStaticParams() {
  // Pre-generate top sản phẩm cho ISR
  const items = await serverApi.getAllProductSlugs();
  return items.slice(0, 50).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await serverApi.getProductBySlug(params.slug);
  if (!product) {
    return { title: "Sản phẩm không tồn tại" };
  }

  const description =
    product.shortDesc ||
    product.description?.slice(0, 160) ||
    `${product.name} - Minh Tien Fashion`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: `${SITE_URL}/san-pham/${product.slug}`,
      images: [
        {
          url: product.thumbnail,
          width: 800,
          height: 1000,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [product.thumbnail],
    },
    alternates: {
      canonical: `${SITE_URL}/san-pham/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await serverApi.getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }
  const t = await getTranslations("productDetail");

  const price = toNumber(product.salePrice ?? product.basePrice);
  const inStock = product.variants?.some((v: any) => v.stock > 0);

  // JSON-LD Product
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images?.length ? product.images : [product.thumbnail],
    sku: product.id,
    brand: { "@type": "Brand", name: "Minh Tien Fashion" },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "VND",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/san-pham/${product.slug}`,
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(product.rating).toFixed(1),
        reviewCount: product.reviewCount,
      },
    }),
  };

  // Breadcrumb LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Sản phẩm",
        item: `${SITE_URL}/san-pham`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/san-pham/${product.slug}`,
      },
    ],
  };

  return (
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1 text-sm text-primary-500"
      >
        <Link href="/" className="hover:text-primary-800">
          {t("home")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/san-pham" className="hover:text-primary-800">
          {t("products")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary-800 line-clamp-1">{product.name}</span>
      </nav>

      <ProductDetailClient product={product} />

      <TrackRecentlyViewed
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          thumbnail: product.thumbnail,
          basePrice: toNumber(product.basePrice),
          salePrice: product.salePrice ? toNumber(product.salePrice) : null,
        }}
      />

      <ReviewSection
        productId={product.id}
        productSlug={product.slug}
        rating={Number(product.rating ?? 0)}
        reviewCount={product.reviewCount ?? 0}
      />

      <RelatedProducts productId={product.id} />

      <RecentlyViewed excludeId={product.id} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </div>
  );
}
