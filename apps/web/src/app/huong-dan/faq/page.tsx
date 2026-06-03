"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";

const faqs = {
  vi: [
    ["Bao lâu tôi nhận được hàng?", "Nội thành thường 1-2 ngày, tỉnh thành khác 2-5 ngày tuỳ đơn vị vận chuyển."],
    ["Tôi có thể đổi size không?", "Có. Bạn có thể đổi size trong 30 ngày nếu sản phẩm còn nguyên trạng."],
    ["Đơn từ bao nhiêu được miễn phí ship?", "Đơn hàng từ 500.000đ được miễn phí vận chuyển."],
    ["Có thanh toán khi nhận hàng không?", "Có. Minh Tien Fashion hỗ trợ COD, VNPay và Momo."],
  ],
  en: [
    ["When will I receive my order?", "Inner-city orders typically arrive in 1-2 days, other provinces 2-5 days depending on the carrier."],
    ["Can I exchange size?", "Yes. You can exchange size within 30 days if the product is in original condition."],
    ["What is the free shipping threshold?", "Orders from 500,000đ qualify for free shipping."],
    ["Is cash on delivery available?", "Yes. Minh Tien Fashion supports COD, VNPay and Momo."],
  ],
} as const;

const headings = {
  vi: "Câu hỏi thường gặp",
  en: "Frequently asked questions",
} as const;

export default function FaqPage() {
  const locale = useLocale() as "vi" | "en";
  const [open, setOpen] = useState(0);
  const list = faqs[locale] ?? faqs.vi;

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-2xl font-bold">{headings[locale] ?? headings.vi}</h1>
      <div className="mx-auto max-w-3xl space-y-3">
        {list.map(([question, answer], index) => (
          <div key={question} className="rounded-lg border border-primary-100 bg-white">
            <button
              type="button"
              onClick={() => setOpen(open === index ? -1 : index)}
              className="flex w-full items-center justify-between p-4 text-left font-medium"
            >
              {question}
              <ChevronDown className={`h-4 w-4 transition-transform ${open === index ? "rotate-180" : ""}`} />
            </button>
            {open === index && (
              <p className="border-t border-primary-100 p-4 text-sm text-primary-500">{answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
