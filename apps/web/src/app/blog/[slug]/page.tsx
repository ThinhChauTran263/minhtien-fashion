import { ProductCard } from "@/components/product/product-card";
import { getTranslations } from "next-intl/server";

const products = [
  { id: "3", slug: "tshirt-basic-cotton", name: "T-Shirt Basic Cotton", thumbnail: "/images/tshirt-basic-1.svg", basePrice: 199000, salePrice: null, category: { name: "T-Shirt" } },
  { id: "5", slug: "tshirt-oversize-streetwear", name: "T-Shirt Oversize Streetwear", thumbnail: "/images/tshirt-oversize-1.svg", basePrice: 280000, salePrice: 249000, category: { name: "T-Shirt" } },
  { id: "6", slug: "sweatshirt-basic-unisex", name: "Sweatshirt Basic Unisex", thumbnail: "/images/sweatshirt-1.svg", basePrice: 450000, salePrice: null, category: { name: "Sweatshirt" } },
];

export const metadata = {
  title: "Áo cổ tròn - T-Shirt, Sweatshirt nam",
  description: "Áo cổ tròn nam: t-shirt cotton, sweatshirt nỉ. Form chuẩn, dễ phối đồ.",
};

export default async function RoundNeckPage() {
  const t = await getTranslations("roundneckPage");
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

