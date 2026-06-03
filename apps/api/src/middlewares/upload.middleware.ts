import multer from "multer";
import { AppError } from "./error.middleware";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)", 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadSingle = upload.single("file");
export const uploadMultiple = upload.array("files", 10);
