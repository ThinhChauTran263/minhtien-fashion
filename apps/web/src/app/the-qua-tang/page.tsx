import Link from "next/link";
import { Gift } from "lucide-react";

export default function GiftCardPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <Gift className="h-8 w-8 text-primary-800" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Thẻ quà tặng Minh Tien</h1>
        <p className="mt-3 text-gray-500">
          Thẻ quà tặng hiện được phát hành trực tiếp bởi cửa hàng cho từng tài khoản khách hàng hoặc theo chương trình chăm sóc khách hàng.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/account/gift-cards" className="btn-primary px-5 py-3">
            Xem thẻ của tôi
          </Link>
          <Link href="/" className="rounded-button border border-primary-200 px-5 py-3 text-sm font-medium text-primary-800 hover:bg-primary-50">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
