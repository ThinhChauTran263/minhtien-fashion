export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

export function formatDate(value: string | Date, locale: string = "vi-VN"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const ORDER_STATUS_LABELS: Record<"vi" | "en", Record<string, string>> = {
  vi: {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang xử lý",
    SHIPPING: "Đang giao",
    DELIVERED: "Đã giao",
    CANCELLED: "Đã hủy",
    RETURNED: "Hoàn trả",
  },
  en: {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPING: "Shipping",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURNED: "Returned",
  },
};

// Backwards-compatible exports (default Vietnamese)
export const orderStatusLabels: Record<string, string> = ORDER_STATUS_LABELS.vi;

export function getOrderStatusLabel(status: string, locale: "vi" | "en" = "vi"): string {
  return ORDER_STATUS_LABELS[locale]?.[status] ?? ORDER_STATUS_LABELS.vi[status] ?? status;
}

export function orderStatusClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "CONFIRMED":
    case "PROCESSING":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "SHIPPING":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "CANCELLED":
    case "RETURNED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-primary-50 text-primary-600 border-primary-200";
  }
}

// Alias for the locale-aware codepath (same classes, different name for readability)
export const orderStatusClassByStatus = orderStatusClass;

export function fullAddress(address: {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}): string {
  return [address.street, address.ward, address.district, address.province]
    .filter(Boolean)
    .join(", ");
}

