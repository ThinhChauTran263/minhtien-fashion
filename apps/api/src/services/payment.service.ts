import crypto from "crypto";
import { env } from "../config/env";

// ============ VNPAY ============

/**
 * Sắp xếp object theo key alphabet và URL-encode value (giống quy chuẩn của VNPay).
 */
function sortObject<T extends Record<string, string | number>>(obj: T): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, "+");
  }
  return sorted;
}

function buildQuery(obj: Record<string, string>): string {
  return Object.keys(obj)
    .map((k) => `${k}=${obj[k]}`)
    .join("&");
}

interface VnpayOrderInput {
  code: string;
  total: number;
  ipAddr?: string;
  bankCode?: string;
  locale?: "vn" | "en";
}

/**
 * Tạo URL thanh toán VNPay.
 */
export function createVnpayUrl(order: VnpayOrderInput): string {
  if (!env.vnpay.tmnCode || !env.vnpay.hashSecret) {
    throw new Error("VNPAY chưa được cấu hình");
  }

  const date = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const createDate = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

  const params: Record<string, string | number> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: env.vnpay.tmnCode,
    vnp_Amount: Math.round(order.total * 100), // VNPay yêu cầu nhân 100
    vnp_CurrCode: "VND",
    vnp_TxnRef: order.code,
    vnp_OrderInfo: `Thanh toan don hang ${order.code}`,
    vnp_OrderType: "other",
    vnp_Locale: order.locale ?? "vn",
    vnp_ReturnUrl: env.vnpay.returnUrl,
    vnp_IpAddr: order.ipAddr ?? "127.0.0.1",
    vnp_CreateDate: createDate,
  };

  if (order.bankCode) {
    params.vnp_BankCode = order.bankCode;
  }

  const sorted = sortObject(params);
  const signData = buildQuery(sorted);
  const hmac = crypto.createHmac("sha512", env.vnpay.hashSecret);
  const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  sorted.vnp_SecureHash = secureHash;

  return `${env.vnpay.url}?${buildQuery(sorted)}`;
}

/**
 * Verify chữ ký từ VNPay (return URL hoặc IPN).
 * @returns { valid, code, txnRef, amount, transactionStatus }
 */
export function verifyVnpayReturn(query: Record<string, string>): {
  valid: boolean;
  txnRef: string;
  amount: number;
  responseCode: string;
  transactionStatus: string;
} {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;

  // Sắp xếp theo alphabet như khi tạo URL
  const sorted: Record<string, string> = {};
  Object.keys(rest)
    .sort()
    .forEach((key) => {
      sorted[key] = encodeURIComponent(rest[key]).replace(/%20/g, "+");
    });

  const signData = buildQuery(sorted);
  const hmac = crypto.createHmac("sha512", env.vnpay.hashSecret);
  const computed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return {
    valid: computed === vnp_SecureHash,
    txnRef: rest.vnp_TxnRef ?? "",
    amount: Number(rest.vnp_Amount ?? 0) / 100,
    responseCode: rest.vnp_ResponseCode ?? "",
    transactionStatus: rest.vnp_TransactionStatus ?? "",
  };
}

// ============ MOMO ============

interface MomoOrderInput {
  code: string;
  total: number;
  orderInfo?: string;
  extraData?: string;
}

/**
 * Tạo payment Momo, return payUrl từ Momo API.
 */
export async function createMomoPayment(order: MomoOrderInput): Promise<string> {
  if (!env.momo.partnerCode || !env.momo.accessKey || !env.momo.secretKey) {
    throw new Error("MOMO chưa được cấu hình");
  }

  const requestId = `${order.code}-${Date.now()}`;
  const orderId = `${order.code}-${Date.now()}`;
  const orderInfo = order.orderInfo ?? `Thanh toan don hang ${order.code}`;
  const amount = String(Math.round(order.total));
  const extraData = order.extraData ?? "";
  const requestType = "captureWallet";

  // Raw signature theo thứ tự BẮT BUỘC của Momo
  const rawSignature =
    `accessKey=${env.momo.accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${env.momo.ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${env.momo.partnerCode}` +
    `&redirectUrl=${env.momo.returnUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", env.momo.secretKey)
    .update(rawSignature)
    .digest("hex");

  const body = {
    partnerCode: env.momo.partnerCode,
    partnerName: "Minh Tien Fashion",
    storeId: "MTF_STORE",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl: env.momo.returnUrl,
    ipnUrl: env.momo.ipnUrl,
    lang: "vi",
    extraData,
    requestType,
    signature,
  };

  const res = await fetch(env.momo.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { resultCode: number; payUrl?: string; message?: string };

  if (data.resultCode !== 0 || !data.payUrl) {
    throw new Error(`Momo lỗi: ${data.message ?? "Không tạo được payment"}`);
  }

  return data.payUrl;
}

/**
 * Verify callback từ Momo (cả IPN và redirect).
 */
export function verifyMomoCallback(body: Record<string, any>): {
  valid: boolean;
  orderId: string;
  amount: number;
  resultCode: number;
} {
  const {
    accessKey: _accessKey,
    signature,
    ...fields
  } = body;

  const rawSignature =
    `accessKey=${env.momo.accessKey}` +
    `&amount=${fields.amount}` +
    `&extraData=${fields.extraData ?? ""}` +
    `&message=${fields.message}` +
    `&orderId=${fields.orderId}` +
    `&orderInfo=${fields.orderInfo}` +
    `&orderType=${fields.orderType}` +
    `&partnerCode=${fields.partnerCode}` +
    `&payType=${fields.payType ?? ""}` +
    `&requestId=${fields.requestId}` +
    `&responseTime=${fields.responseTime}` +
    `&resultCode=${fields.resultCode}` +
    `&transId=${fields.transId}`;

  const computed = crypto
    .createHmac("sha256", env.momo.secretKey)
    .update(rawSignature)
    .digest("hex");

  return {
    valid: computed === signature,
    orderId: String(fields.orderId ?? ""),
    amount: Number(fields.amount ?? 0),
    resultCode: Number(fields.resultCode ?? -1),
  };
}
