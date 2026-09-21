import dotenv from "dotenv";
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET || "change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  VODAFONE_CASH: process.env.VODAFONE_CASH || "01067254988",
  MONTHLY_PRICE: parseFloat(process.env.MONTHLY_PRICE || "15"),
  REFERRAL_TARGET: parseInt(process.env.REFERRAL_TARGET || "7", 10),
};