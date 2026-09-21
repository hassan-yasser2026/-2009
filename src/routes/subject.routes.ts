import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../milddleware/auth";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { gradeId: true, sectionId: true },
  });

  if (!user) return res.status(404).json({ error: "not_found" });

  const subjects = await prisma.subject.findMany({
    where: {
      gradeId: user.gradeId,
      OR: [
        { sectionId: null },
        { sectionId: user.sectionId ?? undefined },
      ],
    },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { lectures: true } },
    },
  });

  return res.json(subjects);
});

router.get("/:id/lectures", authMiddleware, async (req: AuthRequest, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const lectures = await prisma.lecture.findMany({
    where: { subjectId: id },
    orderBy: { order: "asc" },
  });

  return res.json(lectures);
});

export default router;