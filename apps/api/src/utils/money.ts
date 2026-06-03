/**
 * Utility tính toán tiền tệ cho VND.
 * VND không có phần thập phân → mọi kết quả cuối cùng phải là số nguyên.
 * Dùng HALF_EVEN (Banker's rounding) để tránh bias khi làm tròn hàng loạt.
 */

/**
 * Làm tròn Banker's (HALF_EVEN): nếu phần thập phân đúng 0.5,
 * làm tròn về số chẵn gần nhất.
 * Ví dụ: 2.5 → 2, 3.5 → 4, 4.5 → 4, 5.5 → 6
 */
export function roundHalfEven(value: number): number {
  const floored = Math.floor(value);
  const decimal = value - floored;

  if (Math.abs(decimal - 0.5) < Number.EPSILON) {
    return floored % 2 === 0 ? floored : floored + 1;
  }
  return Math.round(value);
}

/**
 * Tính phần trăm và làm tròn an toàn.
 * Ví dụ: percentOf(150000, 10) = 15000 (10% của 150k)
 */
export function percentOf(amount: number, percent: number): number {
  return roundHalfEven((amount * percent) / 100);
}

/**
 * Tính VAT từ tổng tiền đã bao gồm VAT.
 * Formula: vatAmount = total * rate / (100 + rate)
 */
export function extractVatInclusive(totalWithVat: number, vatRate: number): number {
  return roundHalfEven((totalWithVat * vatRate) / (100 + vatRate));
}

/**
 * Chia đều (prorate) một khoản tiền vào N phần theo tỷ trọng.
 * Đảm bảo tổng các phần = amount chính xác (không hụt/thừa).
 *
 * Thuật toán Largest Remainder:
 * 1. Tính phần lý thuyết cho mỗi item (có thể lẻ)
 * 2. Floor tất cả → tổng sẽ <= amount
 * 3. Phần dư (amount - tổng floor) phân bổ cho các item có remainder lớn nhất
 *
 * @param amount - Tổng tiền cần chia (VND, số nguyên)
 * @param weights - Mảng tỷ trọng (thường là giá * số lượng của mỗi item)
 * @returns Mảng số tiền đã prorate, tổng luôn = amount
 */
export function prorate(amount: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight === 0) return weights.map(() => 0);

  const rawShares = weights.map((w) => (amount * w) / totalWeight);
  const floored = rawShares.map((s) => Math.floor(s));
  let remainder = amount - floored.reduce((s, f) => s + f, 0);

  const remainders = rawShares.map((s, i) => ({ index: i, frac: s - floored[i] }));
  remainders.sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder; i++) {
    floored[remainders[i].index] += 1;
  }

  return floored;
}

/**
 * Convert Prisma Decimal sang number an toàn.
 * Prisma Decimal có thể là object hoặc string.
 */
export function toVND(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num);
}
