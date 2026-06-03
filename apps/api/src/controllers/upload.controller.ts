import { Request, Response, NextFunction } from "express";
import { uploadService } from "../services/upload.service";
import { AppError } from "../middlewares/error.middleware";

export const uploadController = {
  async uploadSingle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError("Không tìm thấy file ảnh", 400);
      }
      const result = await uploadService.uploadFile(req.file);
      res.json({ success: true, data: { url: result.url, publicId: result.key } });
    } catch (err) {
      next(err);
    }
  },
};
