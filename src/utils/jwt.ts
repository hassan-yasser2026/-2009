import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function signToken(payload: { userId: string; isAdmin?: boolean }) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as {
    userId: string;
    isAdmin?: boolean;
  };
}