import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-20 border-t border-primary-800 bg-primary-950 text-primary-100">
      <div className="container-page py-14">
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 pb-10 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <p className="overline-text text-primary-400">{t("newsletterOverline")}</p>
            <h3 className="mt-2 text-heading-lg text-white">{t("newsletterTitle")}</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-300">
              {t("newsletterText")}
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-2 gap-8 pt-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-display text-2xl font-bold text-white">MINH TIEN</h3>
            <p className="mt-4 text-sm leading-6 text-primary-300">
              {t("brandDesc")}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{t("products")}</h4>
            <ul className="space-y-2 text-sm text-primary-300">
              <li><Link href="/ao-co-co" className="hover:text-white">{t("collared")}</Link></li>
              <li><Link href="/ao-co-tron" className="hover:text-white">{t("roundneck")}</Link></li>
              <li><Link href="/products" className="hover:text-white">{t("all")}</Link></li>
              <li><Link href="/flash-sale" className="hover:text-white">{t("flashSale")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{t("support")}</h4>
            <ul className="space-y-2 text-sm text-primary-300">
              <li><Link href="/size-guide" className="hover:text-white">{t("sizeGuide")}</Link></li>
              <li><Link href="/return-policy" className="hover:text-white">{t("returnPolicy")}</Link></li>
              <li><Link href="/faq" className="hover:text-white">{t("faq")}</Link></li>
              <li><Link href="/compare" className="hover:text-white">{t("compare")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{t("contact")}</h4>
            <ul className="space-y-2 text-sm text-primary-300">
              <li>Email: hotro@minhtien.vn</li>
              <li>Hotline: 1900 xxxx</li>
              <li>{t("freeship")}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs uppercase tracking-widest text-primary-500">
          {t("copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}

