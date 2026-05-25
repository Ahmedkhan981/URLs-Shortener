import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void,
  ) => {
    const uploadPath = path.join(process.cwd(), "public", "uploads", "avatar");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    callback(null, uploadPath);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    const ext = file.originalname.split(".").pop();
    callback(
      null,
      `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${ext}`,
    );
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
  } else {
    callback(new Error("Only image files are allowed!"));
  }
};

export const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 5MB
  },
});
