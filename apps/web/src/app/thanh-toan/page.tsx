"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { orderApi, userApi } from "@/lib/api";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

const VOUCHER_KEYS: Record<string, { labelKey: string; discount: (subtotal: number, shippingFee: number) => number }> = {
  MTF10: { labelKey: "voucher10", discount: (subtotal) => Math.min(subtotal * 0.1, 50000) },
  FREESHIP: { labelKey: "voucherFreeship", discount: (_subtotal, shippingFee) => shippingFee },
};

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations("checkout");
  const { items, getTotal, clear } = useCartStore();
  const subtotal = getTotal();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;

  const [form, setForm] = useState({
    format: "NEW" as "NEW" | "OLD",
    shippingName: "",
    shippingPhone: "",
    province: "",
    district: "",
    ward: "",
    provinceId: undefined as number | undefined,
    wardCode: undefined as string | undefined,
    street: "",
    paymentMethod: "COD",
    note: "",
    addressType: "HOME" as "HOME" | "OFFICE",
  });
  
  // Addresses logic
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  
  // Locations logic
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    userApi.getProvinces().then((res) => setProvinces(res.data?.data || []));
  }, []);

  useEffect(() => {
    if (form.format === "NEW" && form.provinceId) {
      userApi.getWardsByProvince(form.provinceId).then((res) => setWards(res.data?.data || []));
    } else {
      setWards([]);
    }
  }, [form.provinceId, form.format]);

  const [voucherInput, setVoucherInput] = useState("");
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [orderRedirecting, setOrderRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
    userApi.getAddresses().then((res) => {
      const addrs = res.data?.data || [];
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        const def = addrs.find((a: any) => a.isDefault) || addrs[0];
        setSelectedAddressId(def.id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted || orderRedirecting || items.length > 0) return;
    const timer = window.setTimeout(() => {
      if (useCartStore.getState().items.length === 0) router.push("/gio-hang");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [items.length, mounted, orderRedirecting, router]);

  const discount = useMemo(() => {
    if (!voucherCode) return 0;
    return VOUCHER_KEYS[voucherCode]?.discount(subtotal, shippingFee) ?? 0;
  }, [shippingFee, subtotal, voucherCode]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const applyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code || !VOUCHER_KEYS[code]) {
      setVoucherCode(null);
      toast.error(t("voucherInvalid"));
      return;
    }
    setVoucherCode(code);
    toast.success(t("voucherApplied", { code }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || items.length === 0) return;
    setLoading(true);

    try {
      const idempotencyKey = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      
      let finalPayload: any = {
        paymentMethod: form.paymentMethod,
        note: form.note || undefined,
        voucherCode: voucherCode ?? undefined,
        items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      };

      if (selectedAddressId !== "new") {
        finalPayload.addressId = selectedAddressId;
        const sel = savedAddresses.find((a) => a.id === selectedAddressId);
        finalPayload.shippingName = sel?.fullName || "";
        finalPayload.shippingPhone = sel?.phone || "";
        finalPayload.shippingAddress = `${sel?.street}, ${sel?.ward}, ${sel?.district}, ${sel?.province}`;
        finalPayload.toDistrictId = sel?.districtId;
        finalPayload.toWardCode = sel?.wardCode;
        finalPayload.addressType = sel?.type;
      } else {
        finalPayload.shippingName = form.shippingName;
        finalPayload.shippingPhone = form.shippingPhone;
        finalPayload.shippingAddress = `${form.street}, ${form.ward}, ${form.district ? form.district + ', ' : ''}${form.province}`;
        finalPayload.toDistrictId = undefined; // API now doesn't strictly need this if we don't use GHN directly yet
        finalPayload.toWardCode = form.format === "NEW" ? form.wardCode : undefined;
        finalPayload.addressType = form.addressType;
      }

      const { data } = await orderApi.create(finalPayload, idempotencyKey);

      setOrderRedirecting(true);
      clear();
      toast.success(t("orderSuccess"));
      router.push(`/don-hang/${data.data.code}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("orderError"));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || (!orderRedirecting && items.length === 0)) return null;

  if (orderRedirecting) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-primary-500">{t("redirecting")}</p>
      </div>
    );
  }

  const paymentOptions = [
    { value: "COD", label: t("methodCOD") },
    { value: "VNPAY", label: t("methodVNPAY") },
    { value: "MOMO", label: t("methodMOMO") },
  ];

  return (
    <div className="container-page py-8">
      <h1 className="mb-8 text-2xl font-bold">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-4 font-semibold">{t("shippingInfo")}</h2>
            
            {savedAddresses.length > 0 && (
              <div className="mb-6 space-y-3">
                {savedAddresses.map((addr) => (
                  <label key={addr.id} className="flex cursor-pointer items-start gap-3 rounded border p-4 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="addressSelect"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-primary-800"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{addr.fullName}</span>
                        <span className="text-sm text-gray-500">| {addr.phone}</span>
                        {addr.type === "OFFICE" && (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                            Văn phòng
                          </span>
                        )}
                        {addr.type === "HOME" && (
                          <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 border border-green-200">
                            Nhà riêng
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                      </p>
                    </div>
                  </label>
                ))}
                
                <label className="flex cursor-pointer items-center gap-3 rounded border p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="addressSelect"
                    checked={selectedAddressId === "new"}
                    onChange={() => setSelectedAddressId("new")}
                    className="accent-primary-800"
                  />
                  <span className="font-medium">Giao đến địa chỉ khác...</span>
                </label>
              </div>
            )}

            {selectedAddressId === "new" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-slideDown">
                
                <div className="md:col-span-2 mb-2 flex gap-6 border-b border-gray-100 pb-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="radio"
                      name="format"
                      checked={form.format === "OLD"}
                      onChange={() => setForm({ ...form, format: "OLD" })}
                      className="accent-primary-800"
                    />
                    Địa chỉ cũ (nhập tay)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="radio"
                      name="format"
                      checked={form.format === "NEW"}
                      onChange={() => setForm({ ...form, format: "NEW" })}
                      className="accent-primary-800"
                    />
                    Địa chỉ mới chuẩn
                  </label>
                </div>

                <input name="shippingName" placeholder={t("fullName")} required value={form.shippingName} onChange={handleChange} className="input" />
                <input name="shippingPhone" placeholder={t("phone")} required value={form.shippingPhone} onChange={handleChange} className="input" />
                
                {form.format === "OLD" ? (
                  <>
                    <input required placeholder="Tỉnh/Thành phố" value={form.province} onChange={e => setForm({...form, province: e.target.value})} className="input" />
                    <input required placeholder="Quận/Huyện" value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="input" />
                    <input required placeholder="Xã/Phường" value={form.ward} onChange={e => setForm({...form, ward: e.target.value})} className="input md:col-span-2" />
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <Combobox
                        placeholder="Chọn Tỉnh/Thành phố..."
                        items={provinces.map(p => ({ id: p.id, label: p.name }))}
                        value={form.provinceId}
                        onChange={(item) => setForm({ ...form, provinceId: item.id, province: item.label, wardCode: undefined, ward: "" })}
                      />
                    </div>
                    <div className="relative">
                      <Combobox
                        placeholder="Chọn Xã/Phường..."
                        items={wards.map(w => ({ id: w.code, label: w.name, subLabel: w.districtName }))}
                        value={form.wardCode}
                        disabled={!form.provinceId}
                        onChange={(item) => setForm({ ...form, wardCode: item.id, ward: item.label, district: item.subLabel })}
                      />
                    </div>
                  </>
                )}

                <input name="street" placeholder={t("street")} required value={form.street} onChange={handleChange} className="input md:col-span-2" />
                
                <div className="mt-2 flex gap-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="radio"
                      name="addressType"
                      checked={form.addressType === "HOME"}
                      onChange={() => setForm({ ...form, addressType: "HOME" })}
                      className="accent-primary-800"
                    />
                    Nhà riêng
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="radio"
                      name="addressType"
                      checked={form.addressType === "OFFICE"}
                      onChange={() => setForm({ ...form, addressType: "OFFICE" })}
                      className="accent-primary-800"
                    />
                    Cơ quan / Văn phòng
                  </label>
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-semibold">{t("paymentMethod")}</h2>
            <div className="space-y-3">
              {paymentOptions.map((method) => (
                <label key={method.value} className="flex cursor-pointer items-center gap-3 rounded border p-3 hover:bg-primary-50">
                  <input type="radio" name="paymentMethod" value={method.value} checked={form.paymentMethod === method.value} onChange={handleChange} className="accent-primary-800" />
                  <span className="text-sm">{method.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-semibold">{t("noteHeading")}</h2>
            <textarea name="note" placeholder={t("notePlaceholder")} value={form.note} onChange={handleChange} rows={3} className="input" />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg bg-primary-50 p-6">
            <h2 className="mb-4 font-semibold">{t("summary", { count: items.length })}</h2>

            <div className="mb-4 max-h-60 space-y-3 overflow-y-auto">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between gap-3 text-sm">
                  <span className="text-primary-600">
                    {item.productName} ({item.color}/{item.size}) x{item.quantity}
                  </span>
                  <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mb-4 flex gap-2">
              <input
                value={voucherInput}
                onChange={(event) => setVoucherInput(event.target.value)}
                placeholder={t("voucherPlaceholder")}
                className="input py-2 text-sm"
              />
              <button type="button" onClick={applyVoucher} className="btn-outline shrink-0 px-4 py-2 text-sm">
                {t("voucherApply")}
              </button>
            </div>
            {voucherCode && (
              <p className="mb-4 text-xs text-emerald-700">
                {voucherCode}: {t(VOUCHER_KEYS[voucherCode].labelKey as any)}
              </p>
            )}

            <div className="space-y-2 border-t border-primary-200 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-primary-500">{t("subtotal")}</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-primary-500">{t("shipping")}</span><span>{shippingFee === 0 ? t("shippingFree") : formatPrice(shippingFee)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-700"><span>{t("discount")}</span><span>-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>{t("total")}</span><span>{formatPrice(subtotal + shippingFee - discount)}</span></div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
              {loading ? t("submitting") : t("submit")}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}


