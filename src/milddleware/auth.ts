import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.isAdmin = decoded.isAdmin;

    // نتحقق إن الاشتراك لسه شغال
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { status: true, subscriptionEnd: true, isAdmin: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isAdmin) {
      if (user.status !== "active") {
        return res.status(403).json({
          error: "subscription_inactive",
          message: "الاشتراك غير نشط",
        });
      }
      if (user.subscriptionEnd && user.subscriptionEnd < new Date()) {
        return res.status(403).json({
          error: "subscription_expired",
          message: "انتهى الاشتراك",
        });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}