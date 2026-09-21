import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../utils/jwt";
import { generateReferralCode } from "../utils/codes";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().length(11),
  password: z.string().min(8),
  gradeId: z.number().int().min(1).max(6),
  gradeName: z.string(),
  sectionId: z.string().nullable().optional(),
  sectionName: z.string().nullable().optional(),
  referralCode: z.string().optional(),
});

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // تأكد إن الإيميل والموبايل مش متسجلين
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existing) {
      return res.status(400).json({
        error: "already_exists",
        message: "الإيميل أو الموبايل مسجل بالفعل",
      });
    }

    // تحقق من كود الإحالة لو موجود
    let referrerId: string | null = null;
    if (data.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: data.referralCode.toUpperCase() },
        select: { id: true },
      });
      if (referrer) referrerId = referrer.id;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const referralCode = generateReferralCode(data.fullName);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        passwordHash,
        gradeId: data.gradeId,
        gradeName: data.gradeName,
        sectionId: data.sectionId ?? null,
        sectionName: data.sectionName ?? null,
        referralCode,
        referredBy: referrerId,
        status: "pending",
      },
    });

    // لو فيه referrer، زود عداد الإحالات
    if (referrerId) {
      await prisma.user.update({
        where: { id: referrerId },
        data: { referralCount: { increment: 1 } },
      });
    }

    const token = signToken({ userId: user.id });

    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        gradeId: user.gradeId,
        gradeName: user.gradeName,
        sectionId: user.sectionId,
        sectionName: user.sectionName,
        status: user.status,
        referralCode: user.referralCode,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "validation",
        details: err.issues,
      });
    }
    console.error(err);
    return res.status(500).json({ error: "server_error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: "بيانات الدخول غير صحيحة",
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: "بيانات الدخول غير صحيحة",
      });
    }

    // نتحقق من الاشتراك
    if (user.status !== "active") {
      return res.status(403).json({
        error: "subscription_inactive",
        message: "حسابك لسه في انتظار الموافقة",
        status: user.status,
      });
    }

    if (user.subscriptionEnd && user.subscriptionEnd < new Date()) {
      return res.status(403).json({
        error: "subscription_expired",
        message: "انتهى اشتراكك، يرجى التجديد",
      });
    }

    const token = signToken({ userId: user.id });

    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        gradeId: user.gradeId,
        gradeName: user.gradeName,
        sectionId: user.sectionId,
        sectionName: user.sectionName,
        status: user.status,
        subscriptionEnd: user.subscriptionEnd,
        referralCode: user.referralCode,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;