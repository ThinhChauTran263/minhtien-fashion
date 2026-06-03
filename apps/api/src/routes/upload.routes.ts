import { Router } from "express";
import multer from "multer";
import { uploadService } from "../services/upload.service";
import { uploadController } from "../controllers/upload.controller";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";

const router = Router();

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasValidMagicBytes(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  if (file.mimetype === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === "image/webp") return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

function assertValidImage(file: Express.Multer.File) {
  if (!allowedImageTypes.has(file.mimetype)) throw new AppError("Chá»‰ cháº¥p nháº­n áº£nh JPEG, PNG hoáº·c WebP", 400);
  if (!hasValidMagicBytes(file)) throw new AppError("Ná»™i dung file áº£nh khÃ´ng há»£p lá»‡", 400);
}

function validateUploadedImage(req: any, _res: any, next: any) {
  try {
    if (req.file) assertValidImage(req.file);
    next();
  } catch (err) {
    next(err);
  }
}
const publicUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return cb(new AppError("Chá»‰ cháº¥p nháº­n áº£nh JPEG, PNG hoáº·c WebP", 400));
    }
    cb(null, true);
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return cb(new AppError("Chá»‰ cháº¥p nháº­n áº£nh JPEG, PNG hoáº·c WebP", 400));
    }
    cb(null, true);
  },
});

// ============ PUBLIC ENDPOINT (auth required, no admin) ============
// POST /api/upload â€” upload 1 áº£nh, tráº£ secure_url
router.post("/", authMiddleware, publicUpload.single("file"), validateUploadedImage, uploadController.uploadSingle);

// ============ ADMIN ENDPOINTS ============
router.use(authMiddleware, adminMiddleware);

// POST /api/upload/image - upload 1 áº£nh (admin)
router.post("/image", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("Thiáº¿u file áº£nh", 400);
    assertValidImage(req.file);
    const result = await uploadService.uploadFile(req.file);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/upload/images - upload nhiá»u áº£nh (max 10, admin)
router.post("/images", upload.array("files", 10), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw new AppError("Thiáº¿u file áº£nh", 400);
    files.forEach(assertValidImage);
    const results = await Promise.all(files.map((f) => uploadService.uploadFile(f)));
    res.json({
      success: true,
      data: { urls: results.map((r) => r.url), keys: results.map((r) => r.key) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/upload/presigned - khÃ´ng há»— trá»£ vá»›i Cloudinary
router.post("/presigned", async (_req, res, next) => {
  try {
    throw new AppError("Presigned upload khÃ´ng há»— trá»£ vá»›i Cloudinary", 503);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/upload/:key - xoÃ¡ file trÃªn Cloudinary
router.delete("/:key(*)", async (req, res, next) => {
  try {
    await uploadService.deleteFile(req.params.key);
    res.json({ success: true, message: "ÄÃ£ xoÃ¡ file" });
  } catch (err) {
    next(err);
  }
});

export { router as uploadRoutes };

