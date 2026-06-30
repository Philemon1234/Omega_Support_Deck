import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { customerRoutes } from "./routes/customerRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { smsRoutes } from "./routes/smsRoutes.js";
import { templateRoutes } from "./routes/templateRoutes.js";
import { startSmsScheduler } from "./services/smsScheduler.js";

const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: env.allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Omega Support Deck API is running" });
});

app.use("/api/customers", customerRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/templates", templateRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err instanceof Error ? err.message : err);
  res.status(500).json({ success: false, message: "Something went wrong." });
});

app.listen(env.port, () => {
  console.log(`Omega Support Deck API running on http://localhost:${env.port}`);
  console.log(`SMS mode: ${env.smsMock ? "mock" : "real UGSMS"}`);
  console.log(`UGSMS sender ID: ${env.ugSmsSenderId}`);
  startSmsScheduler();
});
