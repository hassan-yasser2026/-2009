import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../milddleware/auth";

const router = Router();

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      gradeId: true,
      gradeName: true,
      sectionId: true,
      sectionName: true,
      status: true,
      subscriptionEnd: true,
      referralCode: true,
      referralCount: true,
    },
  });

  if (!user) return res.status(404).json({ error: "not_found" });
  return res.json(user);
});

export default router;