import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policies");
  return { title: t("returnTitle") };
}

const sections = {
  vi: [
    ["Thời hạn", "Khách hàng có thể gửi yêu cầu đổi/trả trong 7 ngày kể từ khi đơn hàng được giao thành công."],
    ["Điều kiện", "Sản phẩm còn tem mác, chưa qua giặt ủi, không có mùi lạ và còn hoá đơn/mã đơn hàng."],
    ["Quy trình", "Gửi yêu cầu từ trang chi tiết đơn hàng, chờ Minh Tien Fashion duyệt, sau đó gửi sản phẩm về kho theo hướng dẫn."],
    ["Không áp dụng", "Sản phẩm đã qua sử dụng, hư hỏng do bảo quản sai, quá thời hạn 7 ngày hoặc sản phẩm trong chương trình không đổi trả."],
  ],
  en: [
    ["Window", "You can submit a return / exchange request within 7 days of successful delivery."],
    ["Conditions", "Items must keep original tags, be unwashed, free of odor, with invoice or order code."],
    ["Process", "Submit a request from the order detail page, wait for approval, then ship items back per our instructions."],
    ["Exclusions", "Used or damaged items due to misuse, items past 7 days, or items in non-returnable promotions."],
  ],
} as const;

const introCopy = {
  vi: "Minh Tien Fashion hỗ trợ đổi size, đổi màu hoặc trả hàng hoàn tiền theo các điều kiện dưới đây.",
  en: "Minh Tien Fashion supports size swaps, color exchanges, or refunds under the following terms.",
} as const;

export default async function ReturnPolicyPage() {
  const t = await getTranslations("policies");
  const locale = (await getLocale()) as "vi" | "en";
  const list = sections[locale] ?? sections.vi;
  return (
    <div className="container-page py-10">
      <div className="mb-8 max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold">{t("returnTitle")}</h1>
        <p className="text-sm leading-6 text-primary-500">{introCopy[locale] ?? introCopy.vi}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map(([title, text], index) => (
          <section key={title} className="rounded-lg border border-primary-100 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-accent">0{index + 1}</p>
            <h2 className="mb-2 font-semibold">{title}</h2>
            <p className="text-sm leading-6 text-primary-500">{text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
