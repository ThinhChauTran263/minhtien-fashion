import Link from "next/link";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-bold text-primary-200">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {t("notFound.title")}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {t("notFound.text")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary cursor-pointer">
            {t("common.backHome")}
          </Link>
          <Link
          href="/san-pham"
            className="btn-outline inline-flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            {t("common.viewProducts")}
          </Link>
        </div>
      </div>
    </div>
  );
}

