import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "en"
    ? {
        title: "FAQ",
        description: "Frequently asked questions about Minh Tien Fashion: returns, shipping, payment, sizing.",
      }
    : {
        title: "Câu hỏi thường gặp",
        description: "FAQ - các câu hỏi thường gặp về Minh Tien Fashion: đổi trả, vận chuyển, thanh toán, size",
      };
}

const FAQ_CONTENT: Record<"vi" | "en", { q: string; a: string }[]> = {
  vi: [
    { q: "Đổi trả trong bao lâu?", a: "Bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng. Sản phẩm phải còn nguyên tem mác, chưa qua sử dụng." },
    { q: "Phí vận chuyển bao nhiêu?", a: "Phí vận chuyển cố định 30.000đ trong nội thành. Đơn từ 500.000đ được miễn phí vận chuyển." },
    { q: "Cách chọn size đúng?", a: "Vui lòng tham khảo bảng size chi tiết tại trang Hướng dẫn size. Bạn có thể chat trực tiếp để được tư vấn." },
    { q: "Hỗ trợ thanh toán nào?", a: "Chúng tôi hỗ trợ COD (thanh toán khi nhận hàng), VNPay, Momo, và chuyển khoản ngân hàng." },
    { q: "Bao lâu nhận được hàng?", a: "Đơn hàng được giao trong 2-4 ngày làm việc tuỳ khu vực. Bạn có thể tra cứu trạng thái đơn hàng tại trang Đơn hàng." },
    { q: "Có thể huỷ đơn không?", a: "Bạn có thể huỷ đơn khi đơn còn ở trạng thái Chờ xác nhận. Sau đó vui lòng liên hệ hỗ trợ." },
    { q: "Tích điểm thưởng như thế nào?", a: "Mỗi 100.000đ mua hàng = 1.000 điểm. 1.000 điểm = 10.000đ giảm giá. Điểm có hạn 12 tháng." },
  ],
  en: [
    { q: "How long is the return window?", a: "You can return products within 7 days from delivery. Items must keep tags attached and remain unused." },
    { q: "How much is shipping?", a: "Flat fee 30,000đ for inner-city delivery. Orders over 500,000đ ship for free." },
    { q: "How do I pick the right size?", a: "Please consult the detailed size chart on the Size Guide page. You can also chat with us for advice." },
    { q: "Which payment methods are supported?", a: "We support COD (cash on delivery), VNPay, Momo and bank transfer." },
    { q: "How long does delivery take?", a: "Orders deliver within 2-4 business days depending on region. You can check status on the Track Order page." },
    { q: "Can I cancel an order?", a: "You can cancel an order while it is in the Pending Confirmation state. After that, please contact support." },
    { q: "How do reward points work?", a: "Every 100,000đ spent earns 1,000 points. 1,000 points = 10,000đ discount. Points expire after 12 months." },
  ],
};

export default async function FAQPage() {
  const locale = (await getLocale()) === "en" ? "en" : "vi";
  const t = await getTranslations("faqPage");
  const faqs = FAQ_CONTENT[locale];

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
        <p className="text-gray-500 mb-8">{t("subtitle")}</p>

        <div className="space-y-3">
          {faqs.map((item, idx) => (
            <details
              key={idx}
              className="group bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <summary className="cursor-pointer px-5 py-4 font-medium text-gray-900 flex items-center justify-between list-none">
                {item.q}
                <span className="text-gray-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
