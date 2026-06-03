import type { Metadata } from "next";
import { Ruler } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { serverApi } from "@/lib/server-api";
import { SizeGuideTable } from "@/components/product/size-guide-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sizeGuide");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function SizeGuidePage() {
  const t = await getTranslations("sizeGuide");
  const guide = await serverApi.getSizeGuide();

  const tips = [
    { key: "chest", titleKey: "tipChestTitle", textKey: "tipChest", title: t.has("tipChestTitle") ? t("tipChestTitle") : "" },
  ];

  return (
    <div className="container-page py-10">
      <div className="mb-8 max-w-3xl">
        <h1 className="mb-3 text-3xl font-bold">{t("title")}</h1>
        <p className="text-sm leading-6 text-primary-500">{t("subtitle")}</p>
      </div>

      <SizeGuideTable data={guide?.data} />

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-primary-100 bg-white p-5">
          <Ruler className="mb-3 h-5 w-5 text-accent" />
          <h2 className="mb-2 font-semibold">{t("tipsTitle")}</h2>
          <p className="text-sm text-primary-500">{t("tipChest")}</p>
        </div>
        <div className="rounded-lg border border-primary-100 bg-white p-5">
          <Ruler className="mb-3 h-5 w-5 text-accent" />
          <h2 className="mb-2 font-semibold">{t("tipsTitle")}</h2>
          <p className="text-sm text-primary-500">{t("tipShoulder")}</p>
        </div>
        <div className="rounded-lg border border-primary-100 bg-white p-5">
          <Ruler className="mb-3 h-5 w-5 text-accent" />
          <h2 className="mb-2 font-semibold">{t("tipsTitle")}</h2>
          <p className="text-sm text-primary-500">{t("tipLength")}</p>
        </div>
      </section>
    </div>
  );
}
