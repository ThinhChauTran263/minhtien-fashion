import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policies");
  return {
    title: t("privacyTitle"),
    description: t("privacyDesc"),
  };
}

const SECTIONS: Record<"vi" | "en", { title: string; body: React.ReactNode }[]> = {
  vi: [
    { title: "1. Mục đích thu thập thông tin", body: "Chúng tôi thu thập tên, email, số điện thoại và địa chỉ của bạn nhằm mục đích xử lý đơn hàng, giao hàng, liên hệ hỗ trợ và cải thiện dịch vụ." },
    { title: "2. Phạm vi sử dụng", body: "Thông tin được dùng để xử lý đơn, gửi thông báo trạng thái đơn hàng, chương trình khuyến mãi (nếu bạn đồng ý) và phân tích để nâng cao trải nghiệm." },
    { title: "3. Thời gian lưu trữ", body: "Dữ liệu được lưu trong vòng 3 năm kể từ giao dịch cuối, sau đó được ẩn danh hoặc xoá theo yêu cầu." },
    { title: "4. Chia sẻ với bên thứ ba", body: "Chúng tôi chỉ chia sẻ dữ liệu cần thiết với: đơn vị vận chuyển (GHN), cổng thanh toán (VNPay, Momo) và công cụ phân tích (Google Analytics). Không bán dữ liệu cho bên thứ ba." },
    { title: "5. Quyền của chủ thể dữ liệu", body: "Bạn có quyền truy cập, chỉnh sửa, xoá dữ liệu và rút lại sự đồng ý bất cứ lúc nào. Truy cập trang Tài khoản để xuất hoặc yêu cầu xoá dữ liệu cá nhân." },
    { title: "6. Biện pháp bảo vệ", body: "Dữ liệu được mã hoá khi truyền (SSL/TLS), mật khẩu được hash, và truy cập được giới hạn theo vai trò." },
    { title: "7. Cookie", body: "Chúng tôi dùng cookie để duy trì phiên đăng nhập và phân tích. Bạn có thể từ chối cookie phân tích qua banner đồng ý cookie." },
    { title: "8. Liên hệ", body: <>Mọi thắc mắc về dữ liệu cá nhân, vui lòng liên hệ: <strong>privacy@minhtien.vn</strong>.</> },
  ],
  en: [
    { title: "1. Why we collect information", body: "We collect your name, email, phone and address to process orders, deliver products, provide support and improve our services." },
    { title: "2. Scope of use", body: "Your information is used to process orders, send order updates, promotional notices (with your consent), and analytics to improve your experience." },
    { title: "3. Retention period", body: "Data is retained for 3 years after the last transaction, then anonymized or deleted upon request." },
    { title: "4. Sharing with third parties", body: "We only share necessary data with: delivery partners (GHN), payment gateways (VNPay, Momo) and analytics tools (Google Analytics). We do not sell data to third parties." },
    { title: "5. Data subject rights", body: "You have the right to access, edit, delete data and withdraw consent at any time. Visit the Account page to export or request data deletion." },
    { title: "6. Security measures", body: "Data is encrypted in transit (SSL/TLS), passwords are hashed, and access is role-restricted." },
    { title: "7. Cookies", body: "We use cookies to maintain login sessions and analytics. You can decline analytics cookies via the cookie banner." },
    { title: "8. Contact", body: <>For any questions about personal data, please contact: <strong>privacy@minhtien.vn</strong>.</> },
  ],
};

export default async function PrivacyPolicyPage() {
  const locale = (await getLocale()) === "en" ? "en" : "vi";
  const t = await getTranslations("policies");
  const sections = SECTIONS[locale];
  const lastUpdated = locale === "en" ? "Last updated: 06/01/2026" : "Cập nhật lần cuối: 01/06/2026";

  return (
    <div className="container-page py-12">
      <article className="max-w-3xl mx-auto prose prose-sm sm:prose">
        <h1 className="text-3xl font-bold text-gray-900">{t("privacyTitle")}</h1>
        <p className="text-sm text-gray-500">{lastUpdated}</p>

        {sections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-xl font-semibold mt-8 mb-2">{section.title}</h2>
            <p className="text-gray-600">{section.body}</p>
          </div>
        ))}
      </article>
    </div>
  );
}
