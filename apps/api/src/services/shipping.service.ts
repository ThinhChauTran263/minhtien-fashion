/**
 * GHN Shipping integration.
 * Khi GHN_TOKEN/GHN_SHOP_ID chưa config: fallback giá ship cố định.
 */

const GHN_API_URL = process.env.GHN_API_URL || "https://dev-online-gateway.ghn.vn/shiip/public-api";
const GHN_TOKEN = process.env.GHN_TOKEN || "";
const GHN_SHOP_ID = process.env.GHN_SHOP_ID || "";
const GHN_FROM_DISTRICT = Number(process.env.GHN_FROM_DISTRICT || 1442);

const FALLBACK_SHIPPING_FEE = 30000;
const FREE_SHIP_THRESHOLD = 500000;

const ghnEnabled = Boolean(GHN_TOKEN && GHN_SHOP_ID);

async function ghnFetch<T = any>(path: string, body?: any, method = "POST"): Promise<T> {
  if (!ghnEnabled) throw new Error("GHN chưa được cấu hình");
  const res = await fetch(`${GHN_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Token: GHN_TOKEN,
      ShopId: GHN_SHOP_ID,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as { code: number; data: T; message?: string };
  if (data.code !== 200 && data.code !== undefined) {
    throw new Error(`GHN error: ${data.message || "unknown"}`);
  }
  return data.data;
}

export const shippingService = {
  isEnabled: () => ghnEnabled,

  async getProvinces() {
    if (!ghnEnabled) return [];
    return ghnFetch<any[]>("/master-data/province", {}, "GET").catch(() => []);
  },

  async getDistricts(provinceId: number) {
    if (!ghnEnabled) return [];
    return ghnFetch<any[]>("/master-data/district", { province_id: provinceId }).catch(() => []);
  },

  async getWards(districtId: number) {
    if (!ghnEnabled) return [];
    return ghnFetch<any[]>("/master-data/ward", { district_id: districtId }).catch(() => []);
  },

  /**
   * Tính phí ship. Fallback nếu chưa config GHN: cố định 30K, freeship đơn từ 500K.
   */
  async calculateFee(args: {
    toDistrictId?: number;
    toWardCode?: string;
    weight?: number; // gram, default 500g
    orderValue?: number;
  }): Promise<{ fee: number; estimatedDays: number; source: "ghn" | "fallback" }> {
    const { toDistrictId, toWardCode, weight = 500, orderValue = 0 } = args;

    // Fallback nếu chưa config GHN hoặc thiếu thông tin
    if (!ghnEnabled || !toDistrictId || !toWardCode) {
      const fee = orderValue >= FREE_SHIP_THRESHOLD ? 0 : FALLBACK_SHIPPING_FEE;
      return { fee, estimatedDays: 3, source: "fallback" };
    }

    try {
      // Lấy service available
      const services = await ghnFetch<any[]>("/v2/shipping-order/available-services", {
        shop_id: Number(GHN_SHOP_ID),
        from_district: GHN_FROM_DISTRICT,
        to_district: toDistrictId,
      });
      const serviceId = services?.[0]?.service_id;
      if (!serviceId) {
        return { fee: FALLBACK_SHIPPING_FEE, estimatedDays: 3, source: "fallback" };
      }

      const fee = await ghnFetch<{ total: number }>("/v2/shipping-order/fee", {
        from_district_id: GHN_FROM_DISTRICT,
        service_id: serviceId,
        to_district_id: toDistrictId,
        to_ward_code: toWardCode,
        weight,
        insurance_value: orderValue,
      });

      // Estimated delivery time
      const eta = await ghnFetch<{ leadtime: number }>("/v2/shipping-order/leadtime", {
        from_district_id: GHN_FROM_DISTRICT,
        to_district_id: toDistrictId,
        to_ward_code: toWardCode,
        service_id: serviceId,
      }).catch(() => ({ leadtime: 0 }));

      const estDays = eta.leadtime
        ? Math.max(1, Math.round((eta.leadtime * 1000 - Date.now()) / (24 * 3600 * 1000)))
        : 3;

      const finalFee = orderValue >= FREE_SHIP_THRESHOLD ? 0 : fee.total;
      return { fee: finalFee, estimatedDays: estDays, source: "ghn" };
    } catch (err) {
      console.error("[GHN calculate]", err);
      const fee = orderValue >= FREE_SHIP_THRESHOLD ? 0 : FALLBACK_SHIPPING_FEE;
      return { fee, estimatedDays: 3, source: "fallback" };
    }
  },

  async createShippingOrder(order: {
    code: string;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    toDistrictId: number;
    toWardCode: string;
    items: { name: string; quantity: number; price: number }[];
    weight?: number;
    codAmount?: number;
  }): Promise<{ ghnOrderCode: string; expectedDeliveryTime?: string } | null> {
    if (!ghnEnabled) return null;
    try {
      const data = await ghnFetch<any>("/v2/shipping-order/create", {
        payment_type_id: 2, // người nhận trả phí
        note: `Đơn ${order.code}`,
        required_note: "CHOXEMHANGKHONGTHU",
        client_order_code: order.code,
        to_name: order.shippingName,
        to_phone: order.shippingPhone,
        to_address: order.shippingAddress,
        to_district_id: order.toDistrictId,
        to_ward_code: order.toWardCode,
        weight: order.weight ?? 500,
        cod_amount: order.codAmount ?? 0,
        items: order.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
        })),
      });
      return {
        ghnOrderCode: data.order_code,
        expectedDeliveryTime: data.expected_delivery_time,
      };
    } catch (err) {
      console.error("[GHN create order]", err);
      return null;
    }
  },

  async trackOrder(ghnOrderCode: string) {
    if (!ghnEnabled) return null;
    return ghnFetch("/v2/shipping-order/detail", { order_code: ghnOrderCode }).catch(() => null);
  },

  async cancelOrder(ghnOrderCode: string) {
    if (!ghnEnabled) return null;
    return ghnFetch("/v2/switch-status/cancel", { order_codes: [ghnOrderCode] }).catch(() => null);
  },
};
