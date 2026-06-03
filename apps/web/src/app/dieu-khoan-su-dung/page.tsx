import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policies");
  return { title: t("termsTitle"), description: t("termsDesc") };
}

const sections = {
  vi: [
    ["1. Điều kiện sử dụng", "Bằng việc truy cập website, bạn đồng ý tuân thủ các điều khoản này và pháp luật Việt Nam hiện hành."],
    ["2. Tài khoản người dùng", "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động dưới tài khoản của mình."],
    ["3. Đặt hàng & thanh toán", "Đơn hàng được xác nhận sau khi thanh toán thành công hoặc xác nhận COD. Bạn có thể huỷ đơn khi đơn còn ở trạng thái Chờ xác nhận."],
    ["4. Giao hàng", "Thời gian giao 2-4 ngày tuỳ khu vực. Phí ship 30.000đ, miễn phí đơn từ 500.000đ. Giao hàng toàn quốc."],
    ["5. Đổi trả", "Đổi trả trong 7 ngày với sản phẩm còn nguyên tem mác. Xem chi tiết tại trang Chính sách đổi trả."],
    ["6. Sở hữu trí tuệ", "Toàn bộ hình ảnh, nội dung trên website thuộc sở hữu của Minh Tien Fashion. Nghiêm cấm sao chép khi chưa được phép."],
    ["7. Giới hạn trách nhiệm", "Chúng tôi không chịu trách nhiệm với thiệt hại gián tiếp phát sinh từ việc sử dụng website ngoài phạm vi giao dịch mua bán."],
    ["8. Luật áp dụng & tranh chấp", "Các điều khoản tuân theo pháp luật Việt Nam. Tranh chấp ưu tiên giải quyết qua thương lượng, nếu không thành sẽ đưa ra toà án có thẩm quyền."],
  ],
  en: [
    ["1. Acceptance", "By accessing this website you agree to comply with these terms and applicable Vietnamese law."],
    ["2. User accounts", "You are responsible for keeping your credentials secure and for all activity under your account."],
    ["3. Orders & payment", "Orders are confirmed after successful payment or COD verification. You can cancel while still in Pending status."],
    ["4. Shipping", "Delivery in 2-4 days depending on region. Shipping fee 30,000đ, free over 500,000đ. Nationwide delivery."],
    ["5. Returns", "Returns accepted within 7 days with original tags. See the Return Policy page for details."],
    ["6. Intellectual property", "All images and content belong to Minh Tien Fashion. Reproduction without permission is prohibited."],
    ["7. Liability", "We are not liable for indirect damages arising from website use beyond the scope of the purchase transaction."],
    ["8. Governing law", "These terms follow Vietnamese law. Disputes shall be resolved by negotiation first, then by competent courts."],
  ],
} as const;

export default async function TermsPage() {
  const t = await getTranslations("policies");
  const locale = (await getLocale()) as "vi" | "en";
  const list = sections[locale] ?? sections.vi;
  return (
    <div className="container-page py-12">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">{t("termsTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("lastUpdated", { date: "01/06/2026" })}</p>
        <div className="mt-8 space-y-6">
          {list.map(([h, p]) => (
            <section key={h}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{h}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{p}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
