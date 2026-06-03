import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ruler, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { FlashSaleBanner } from "@/components/product/flash-sale-banner";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { Reveal, StaggerGroup, RevealItem } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";
import { serverApi } from "@/lib/server-api";
import { getTranslations } from "next-intl/server";

export const revalidate = 60;

const fallbackProducts = [
  { id: "1", slug: "polo-classic-cotton", name: "Polo Classic Cotton", thumbnail: "/images/polo-classic-1.svg", basePrice: 350000, salePrice: 299000, category: { name: "Polo" } },
  { id: "2", slug: "polo-dry-fit-sport", name: "Polo Dry-Fit Sport", thumbnail: "/images/polo-dryfit-1.svg", basePrice: 420000, salePrice: null, category: { name: "Polo" } },
  { id: "3", slug: "tshirt-basic-cotton", name: "T-Shirt Basic Cotton", thumbnail: "/images/tshirt-basic-1.svg", basePrice: 199000, salePrice: null, category: { name: "T-Shirt" } },
  { id: "4", slug: "so-mi-oxford-trang", name: "SÆ¡ Mi Oxford Tráº¯ng", thumbnail: "/images/somi-oxford-1.svg", basePrice: 480000, salePrice: 399000, category: { name: "SÆ¡ Mi" } },
];

export default async function HomePage() {
  const t = await getTranslations("home");
  const [featured, newArrivals] = await Promise.all([
    serverApi.getFeaturedProducts(),
    serverApi.getNewArrivals(),
  ]);

  const benefits = [
    { icon: Truck, title: t("benefitShippingTitle"), text: t("benefitShippingText") },
    { icon: ShieldCheck, title: t("benefitReturnTitle"), text: t("benefitReturnText") },
    { icon: Ruler, title: t("benefitSizeTitle"), text: t("benefitSizeText") },
  ];

  const featuredList = (featured && Array.isArray(featured) ? featured : null) ?? fallbackProducts;
  const newList = (newArrivals && Array.isArray(newArrivals) ? newArrivals : null) ?? [];

  return (
    <div className="bg-surface-secondary">
      <FlashSaleBanner />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Atmosphere: soft gradient blob, parallax */}
        <Parallax offset={50} className="pointer-events-none absolute -right-32 -top-24 h-[34rem] w-[34rem] rounded-full bg-gradient-to-br from-accent-200/40 via-accent-100/20 to-transparent blur-3xl" >
          <span className="sr-only">decor</span>
        </Parallax>

        <div className="container-page grid min-h-[calc(100vh-5rem)] grid-cols-1 items-center gap-10 py-10 md:grid-cols-[0.9fr_1.1fr] md:py-16">
          <div>
            <Reveal direction="up" delay={0.05}>
              <p className="overline-text">{t("heroOverline")}</p>
            </Reveal>
            <Reveal direction="up" delay={0.12}>
              <h1 className="mt-4 max-w-xl text-display-lg text-primary-950 md:text-display-xl">
                {t("heroTitle")}
              </h1>
            </Reveal>
            <Reveal direction="up" delay={0.2}>
              <p className="mt-6 max-w-lg text-body-lg text-primary-600">
                {t("heroText")}
              </p>
            </Reveal>
            <Reveal direction="up" delay={0.28}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/products" className="btn-primary group">
                  {t("heroShop")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-luxury group-hover:translate-x-1" />
                </Link>
                <Link href="/size-guide" className="btn-outline">
                  {t("heroFit")}
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal direction="left" delay={0.15} className="relative">
            <Parallax offset={28}>
              <div className="group relative aspect-[4/5] overflow-hidden rounded-card bg-primary-100 shadow-elevated">
                <Image
                  src="/images/polo-classic-1.svg"
                  alt="Minh Tien polo classic"
                  fill
                  priority
                  className="object-cover transition-transform duration-[1200ms] ease-luxury group-hover:scale-105"
                  sizes="(min-width: 768px) 55vw, 100vw"
                />
              </div>
            </Parallax>
            <div className="glass-panel absolute bottom-5 left-5 right-5 rounded-card p-4 md:right-auto md:w-72">
              <p className="text-sm font-semibold text-primary-950">{t("heroBadgeTitle")}</p>
              <p className="mt-1 text-sm text-primary-600">{t("heroBadgeText")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* BENEFITS */}
      <StaggerGroup className="container-page grid gap-4 pb-10 md:grid-cols-3">
        {benefits.map((item) => {
          const Icon = item.icon;
          return (
            <RevealItem key={item.title}>
              <div className="card h-full p-5">
                <Icon className="h-5 w-5 text-accent-500" />
                <h2 className="mt-4 text-heading-sm text-primary-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-primary-600">{item.text}</p>
              </div>
            </RevealItem>
          );
        })}
      </StaggerGroup>

      {/* CATEGORIES */}
      <section className="container-page section-padding">
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="overline-text">{t("catOverline")}</p>
            <h2 className="mt-2 text-display-md text-primary-950">{t("catTitle")}</h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Reveal direction="up" delay={0.05}>
            <Link href="/ao-co-co" className="group relative flex min-h-80 overflow-hidden rounded-card bg-primary-900 p-8 text-white shadow-card">
              <Image src="/images/somi-oxford-1.svg" alt={t("collared")} fill className="object-cover opacity-55 transition-transform duration-700 ease-luxury group-hover:scale-105" sizes="(min-width: 768px) 50vw, 100vw" />
              <div className="relative z-10 mt-auto">
                <p className="text-sm uppercase tracking-widest text-white/70">{t("collaredOverline")}</p>
                <h3 className="mt-2 flex items-center gap-2 text-display-md">
                  {t("collared")}
                  <ArrowRight className="h-6 w-6 -translate-x-2 opacity-0 transition-all duration-300 ease-luxury group-hover:translate-x-0 group-hover:opacity-100" />
                </h3>
              </div>
            </Link>
          </Reveal>
          <Reveal direction="up" delay={0.12}>
            <Link href="/ao-co-tron" className="group relative flex min-h-80 overflow-hidden rounded-card bg-primary-900 p-8 text-white shadow-card">
              <Image src="/images/tshirt-basic-1.svg" alt={t("roundneck")} fill className="object-cover opacity-55 transition-transform duration-700 ease-luxury group-hover:scale-105" sizes="(min-width: 768px) 50vw, 100vw" />
              <div className="relative z-10 mt-auto">
                <p className="text-sm uppercase tracking-widest text-white/70">{t("roundneckOverline")}</p>
                <h3 className="mt-2 flex items-center gap-2 text-display-md">
                  {t("roundneck")}
                  <ArrowRight className="h-6 w-6 -translate-x-2 opacity-0 transition-all duration-300 ease-luxury group-hover:translate-x-0 group-hover:opacity-100" />
                </h3>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-page section-padding">
        <Reveal className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="overline-text">{t("featuredOverline")}</p>
            <h2 className="mt-2 text-display-md text-primary-950">{t("featuredTitle")}</h2>
          </div>
          <Link href="/products" className="luxury-link">{t("viewAll")}</Link>
        </Reveal>
        <StaggerGroup className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {featuredList.slice(0, 8).map((product: any) => (
            <RevealItem key={product.id}>
              <ProductCard product={product} />
            </RevealItem>
          ))}
        </StaggerGroup>
      </section>

      {/* NEW ARRIVALS */}
      {newList.length > 0 && (
        <section className="container-page section-padding">
          <Reveal className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="overline-text">{t("newOverline")}</p>
              <h2 className="mt-2 text-display-md text-primary-950">{t("newTitle")}</h2>
            </div>
            <Link href="/products?sort=newest" className="luxury-link">{t("viewAll")}</Link>
          </Reveal>
          <StaggerGroup className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {newList.slice(0, 4).map((product: any) => (
              <RevealItem key={product.id}>
                <ProductCard product={product} />
              </RevealItem>
            ))}
          </StaggerGroup>
        </section>
      )}

      <section className="container-page py-8">
        <RecentlyViewed title={t("recentlyViewed")} />
      </section>
    </div>
  );
}

