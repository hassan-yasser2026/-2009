import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { env } from "../config/env";

const router = Router();

// رفع السكرين شوت
router.post(
  "/upload",
  authMiddleware,
  upload.single("screenshot"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "no_file",
          message: "من فضلك ارفع صورة التحويل",
        });
      }

      const { transactionRef } = req.body;

      // الرابط النسبي للصورة
      const screenshotUrl = `/uploads/screenshots/${req.file.filename}`;

      const payment = await prisma.payment.create({
        data: {
          userId: req.userId!,
          amount: env.MONTHLY_PRICE,
          screenshotUrl,
          transactionRef: transactionRef || null,
          status: "pending",
        },
      });

      return res.json({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          createdAt: payment.createdAt,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "server_error" });
    }
  }
);

// حالة الدفع الحالية
router.get("/my-status", authMiddleware, async (req: AuthRequest, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      amount: true,
      status: true,
      reviewNote: true,
      createdAt: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { status: true, subscriptionEnd: true },
  });

  return res.json({ user, payments });
});

export default router;