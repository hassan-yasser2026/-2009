import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import subjectRoutes from "./routes/subject.routes";
import paymentRoutes from "./routes/payment.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات المرفوعة
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// Health check
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    name: "Hasan Platform API",
    version: "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/payments", paymentRoutes);

// معالج الأخطاء العام
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "server_error", message: err.message });
});

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
});