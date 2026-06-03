"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";

interface AccountBlockedProps {
  email?: string;
  reason?: string;
}

export function AccountBlocked({ email, reason }: AccountBlockedProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldX className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-primary-900">Tài khoản đã bị khóa</h1>
        {email && (
          <p className="mt-2 text-sm text-primary-500">
            Tài khoản <span className="font-medium text-primary-700">{email}</span> đã bị tạm ngưng.
          </p>
        )}
        {reason && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50/50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">Lý do: {reason}</p>
          </div>
        )}
        <p className="mt-4 text-sm text-primary-500">
          Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ hotro@minhtien.vn để được hỗ trợ.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dang-nhap" className="btn-primary px-6 py-2.5 text-sm">
            Đăng nhập tài khoản khác
          </Link>
          <Link href="/dang-ky" className="btn-outline px-6 py-2.5 text-sm">
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
}
