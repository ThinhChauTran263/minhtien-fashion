import sharp from "sharp";

export interface ImageVariant {
  suffix: string;
  width: number;
}

const IMAGE_VARIANTS: ImageVariant[] = [
  { suffix: "thumb", width: 200 },
  { suffix: "medium", width: 600 },
  { suffix: "large", width: 1200 },
];

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  suffix: string;
  format: "webp";
  contentType: string;
}

export const imageService = {
  /**
   * Nhận buffer ảnh gốc, trả về mảng 3 kích thước WebP.
   * Giữ aspect ratio, chỉ resize width (height auto).
   */
  async processImage(inputBuffer: Buffer): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];

    for (const variant of IMAGE_VARIANTS) {
      const buffer = await sharp(inputBuffer)
        .resize(variant.width, undefined, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      results.push({
        buffer,
        width: variant.width,
        suffix: variant.suffix,
        format: "webp",
        contentType: "image/webp",
      });
    }

    return results;
  },

  /**
   * Tạo key cho từng variant dựa trên key gốc.
   * Ví dụ: products/123-abc.jpg → products/123-abc-thumb.webp
   */
  variantKey(originalKey: string, suffix: string): string {
    const lastDot = originalKey.lastIndexOf(".");
    const base = lastDot > 0 ? originalKey.slice(0, lastDot) : originalKey;
    return `${base}-${suffix}.webp`;
  },
};
