import streamifier from "streamifier";
import { cloudinary, CLOUDINARY_ENABLED } from "../config/cloudinary";
import { AppError } from "../middlewares/error.middleware";

export interface UploadResult {
  url: string;
  key: string;
  variants?: { thumb: string; medium: string; large: string };
}

function buildVariantUrl(publicId: string, width: number): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width, crop: "limit", fetch_format: "auto", quality: "auto" },
    ],
    secure: true,
  });
}

function uploadBuffer(buffer: Buffer, folder: string): Promise<{ secureUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed"));
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export const uploadService = {
  async uploadFile(
    file: Express.Multer.File,
    prefix = "products"
  ): Promise<UploadResult> {
    if (!CLOUDINARY_ENABLED) {
      throw new AppError("Cloudinary chưa được cấu hình", 503);
    }

    const { secureUrl, publicId } = await uploadBuffer(file.buffer, `mtf/${prefix}`);

    const variants: UploadResult["variants"] = {
      thumb: buildVariantUrl(publicId, 200),
      medium: buildVariantUrl(publicId, 600),
      large: buildVariantUrl(publicId, 1200),
    };

    return { url: secureUrl, key: publicId, variants };
  },

  async deleteFile(key: string): Promise<void> {
    if (!CLOUDINARY_ENABLED) return;
    await cloudinary.uploader.destroy(key);
  },

  async getPresignedUrl(): Promise<null> {
    return null;
  },

  async getReadUrl(key: string): Promise<string | null> {
    if (!CLOUDINARY_ENABLED) return null;
    return cloudinary.url(key, { secure: true });
  },
};
