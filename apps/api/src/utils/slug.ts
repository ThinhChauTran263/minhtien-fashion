export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Remove diacritics
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateOrderCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `MTF-${year}-${random}`;
}

export function generateSku(
  category: string,
  color: string,
  size: string
): string {
  const cat = category.substring(0, 3).toUpperCase();
  const col = color.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0");
  return `${cat}-${col}-${size}-${random}`;
}
