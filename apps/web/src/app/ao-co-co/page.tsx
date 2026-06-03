import { ProductCard } from "@/components/product/product-card";
import { getTranslations } from "next-intl/server";

const products = [
  { id: "1", slug: "polo-classic-cotton", name: "Polo Classic Cotton", thumbnail: "/images/polo-classic-1.svg", basePrice: 350000, salePrice: 299000, category: { name: "Polo" } },
  { id: "2", slug: "polo-dry-fit-sport", name: "Polo Dry-Fit Sport", thumbnail: "/images/polo-dryfit-1.svg", basePrice: 420000, salePrice: null, category: { name: "Polo" } },
  { id: "4", slug: "so-mi-oxford-trang", name: "Sơ Mi Oxford Trắng", thumbnail: "/images/somi-oxford-1.svg", basePrice: 480000, salePrice: 399000, category: { name: "Sơ Mi" } },
];

export const metadata = {
  title: "Áo có cổ - Polo, Sơ Mi nam",
  description: "Áo nam có cổ: polo, sơ mi, henley. Chất liệu cao cấp, thiết kế lịch lãm.",
};

export default async function CollarShirtsPage() {
  const t = await getTranslations("collaredPage");
  return (
    <div className="container-page py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3">{t("title")}</h1>
        <p className="text-primary-500 max-w-xl mx-auto">
          {t("desc")}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

