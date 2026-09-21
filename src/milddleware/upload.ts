import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// فولدر التخزين
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "screenshots");

// نتأكد إن الفولدر موجود
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// إعدادات التخزين
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}${ext}`;
    cb(null, uniqueName);
  },
});

// فلتر الملفات (صور بس)
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 ميجا
});