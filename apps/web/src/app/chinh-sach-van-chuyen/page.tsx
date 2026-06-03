import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policies");
  return { title: t("shippingTitle"), description: t("shippingDesc") };
}

const content = {
  vi: [
    ["Đơn vị vận chuyển", "Chúng tôi hợp tác với Giao Hàng Nhanh (GHN) để giao hàng toàn quốc."],
    ["Thời gian giao hàng", "Nội thành: 1-2 ngày làm việc. Ngoại thành / tỉnh: 3-5 ngày làm việc."],
    ["Phí vận chuyển", "Phí cố định 30.000đ. Miễn phí cho đơn hàng từ 500.000đ."],
    ["Kiểm tra hàng", "Với đơn COD, bạn được kiểm tra hàng trước khi thanh toán cho shipper."],
  ],
  en: [
    ["Carriers", "We partner with Giao Hang Nhanh (GHN) for nationwide delivery."],
    ["Delivery time", "Inner city: 1-2 working days. Other provinces: 3-5 working days."],
    ["Shipping fees", "Flat fee 30,000đ. Free shipping for orders over 500,000đ."],
    ["Order inspection", "For COD orders, you can inspect the package before paying the shipper."],
  ],
} as const;

export default async function ShippingPolicyPage() {
  const t = await getTranslations("policies");
  const locale = (await getLocale()) as "vi" | "en";
  const list = content[locale] ?? content.vi;
  return (
    <div className="container-page py-12">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">{t("shippingTitle")}</h1>
        <div className="mt-8 space-y-6 text-sm text-gray-600 leading-relaxed">
          {list.map(([h, p]) => (
            <section key={h}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{h}</h2>
              <p>{p}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
