import { env } from "../config/env";

const VIETQR_BASE = "https://img.vietqr.io/image";

// Cấu hình bank account qua env
const BANK_ID = process.env.VIETQR_BANK_ID || "970422"; // MB Bank mặc định
const ACCOUNT_NO = process.env.VIETQR_ACCOUNT_NO || "";
const ACCOUNT_NAME = process.env.VIETQR_ACCOUNT_NAME || "MINH TIEN FASHION";
const TEMPLATE = process.env.VIETQR_TEMPLATE || "compact2";

export interface VietQRResult {
  qrUrl: string;
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
}

export const vietqrService = {
  isEnabled(): boolean {
    return Boolean(ACCOUNT_NO);
  },

  /**
   * Generate VietQR URL cho 1 đơn hàng.
   * URL trả về là ảnh QR có thể dùng trực tiếp trong <img src="...">.
   * Chuẩn: https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png?amount=X&addInfo=Y&accountName=Z
   */
  generateQR(orderCode: string, amount: number): VietQRResult {
    const description = `MTF ${orderCode}`;
    const params = new URLSearchParams({
      amount: String(Math.round(amount)),
      addInfo: description,
      accountName: ACCOUNT_NAME,
    });

    const qrUrl = `${VIETQR_BASE}/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?${params.toString()}`;

    return {
      qrUrl,
      bankId: BANK_ID,
      accountNo: ACCOUNT_NO,
      accountName: ACCOUNT_NAME,
      amount: Math.round(amount),
      description,
    };
  },
};
