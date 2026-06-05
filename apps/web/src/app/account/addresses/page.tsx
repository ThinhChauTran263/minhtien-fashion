"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { userApi } from "@/lib/api";
import { fullAddress } from "@/lib/customer-utils";
import { Combobox } from "@/components/ui/combobox";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

const emptyForm = { 
  format: "NEW" as "NEW" | "OLD",
  fullName: "", phone: "", 
  province: "", district: "", ward: "", 
  provinceId: undefined as number | undefined, 
  wardCode: undefined as string | undefined,
  street: "", type: "HOME" as "HOME" | "OFFICE", isDefault: false 
};

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: addresses = [] } = useQuery({
    queryKey: ["account", "addresses"],
    queryFn: async () => {
      const { data } = await userApi.getAddresses();
      return data.data ?? [];
    },
    staleTime: 60 * 1000,
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const res = await userApi.getProvinces();
      return res.data?.data || [];
    },
    staleTime: Infinity,
  });

  const { data: wards = [] } = useQuery({
    queryKey: ["wards", form.provinceId],
    queryFn: async () => {
      if (!form.provinceId) return [];
      const res = await userApi.getWardsByProvince(form.provinceId);
      return res.data?.data || [];
    },
    enabled: form.format === "NEW" && !!form.provinceId,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editing) return userApi.updateAddress(editing.id, payload);
      return userApi.addAddress(payload);
    },
    onSuccess: () => {
      toast.success(editing ? t("addressUpdateSuccess") : t("addressSaveSuccess"));
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["account", "addresses"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t("addressSaveError"));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => userApi.updateAddress(id, payload),
    onSuccess: () => {
      toast.success(t("addressDefaultSet"));
      queryClient.invalidateQueries({ queryKey: ["account", "addresses"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteAddress(id),
    onSuccess: () => {
      toast.success(t("addressDeleted"));
      queryClient.invalidateQueries({ queryKey: ["account", "addresses"] });
    }
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...form };
    if (payload.format === "NEW") {
      payload.district = ""; // Xóa dữ liệu huyện nếu là form mới
    } else {
      payload.provinceId = undefined;
      payload.wardCode = undefined;
    }
    saveMutation.mutate(payload);
  };

  const provinceOptions = provinces.map((p: any) => ({ id: p.id, label: p.name }));
  const wardOptions = wards.map((w: any) => ({ id: w.code, label: w.name, subLabel: w.districtName }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("addressesTitle")}</h1>
        <button
          type="button"
          onClick={() => { 
            setEditing(null); 
            setForm(emptyForm); 
            setOpen(true); 
          }}
          className="btn-primary px-4 py-2 text-sm"
        >
          {t("addressAdd")}
        </button>
      </div>

      <div className="space-y-3">
        {addresses.length === 0 && <p className="text-sm text-primary-500">{t("addressesEmpty")}</p>}
        {addresses.map((address: any) => (
          <div key={address.id} className="rounded-lg border border-primary-100 bg-white p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-semibold">{address.fullName}</p>
                  {address.type === "OFFICE" && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                      Văn phòng
                    </span>
                  )}
                  {address.type === "HOME" && (
                    <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 border border-green-200">
                      Nhà riêng
                    </span>
                  )}
                  {address.isDefault && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{t("default")}</span>
                  )}
                </div>
                <p className="text-sm text-primary-500">{address.phone}</p>
                <p className="mt-2 text-sm text-primary-600">{fullAddress(address)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Định dạng: {address.format === "NEW" ? "Mới" : "Cũ"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(address);
                    setForm({
                      format: address.format || "OLD",
                      fullName: address.fullName,
                      phone: address.phone,
                      province: address.province,
                      district: address.district || "",
                      ward: address.ward,
                      provinceId: address.provinceId,
                      wardCode: address.wardCode,
                      street: address.street,
                      type: address.type || "HOME",
                      isDefault: address.isDefault,
                    });
                    setOpen(true);
                  }}
                  className="btn-outline px-3 py-1.5 text-sm"
                >
                  {t("edit")}
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate({ id: address.id, payload: { isDefault: true } })}
                    className="btn-outline px-3 py-1.5 text-sm"
                  >
                    {t("setDefault")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(address.id)}
                  className="btn-outline px-3 py-1.5 text-sm text-red-600"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="mt-6 overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm animate-slideDown">
          <form onSubmit={submit} className="p-5">
            <h2 className="mb-4 text-base font-semibold text-primary-900">{editing ? t("addressEdit") : t("addressAdd")}</h2>
            
            {/* Format Toggle */}
            <div className="mb-6 flex gap-6 border-b border-gray-100 pb-4">
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
                Địa chỉ mới chuẩn (chọn danh sách)
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input required placeholder={t("addressFullName")} value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="input" />
              <input required placeholder={t("addressPhone")} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
              
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
                      items={provinceOptions}
                      value={form.provinceId}
                      onChange={(item) => setForm({ ...form, provinceId: item.id, province: item.label, wardCode: undefined, ward: "" })}
                    />
                  </div>
                  <div className="relative">
                    <Combobox
                      placeholder="Chọn Xã/Phường..."
                      items={wardOptions}
                      value={form.wardCode}
                      disabled={!form.provinceId}
                      onChange={(item) => setForm({ ...form, wardCode: item.id, ward: item.label })}
                    />
                  </div>
                </>
              )}

              <input required placeholder={t("addressStreet")} value={form.street} onChange={e => setForm({...form, street: e.target.value})} className="input md:col-span-2" />
            </div>

            <div className="mt-6 flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="type"
                  checked={form.type === "HOME"}
                  onChange={() => setForm({ ...form, type: "HOME" })}
                  className="accent-primary-800"
                />
                Nhà riêng
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="type"
                  checked={form.type === "OFFICE"}
                  onChange={() => setForm({ ...form, type: "OFFICE" })}
                  className="accent-primary-800"
                />
                Cơ quan / Văn phòng
              </label>
            </div>
            
            <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
                className="accent-primary-800"
              />
              {t("addressSetDefault")}
            </label>
            <div className="mt-5 flex justify-end gap-3 border-t border-primary-50 pt-4">
              <button type="button" onClick={() => setOpen(false)} className="btn-outline px-4 py-2 text-sm">
                {tCommon("cancel")}
              </button>
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary px-4 py-2 text-sm">{t("addressSave")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
