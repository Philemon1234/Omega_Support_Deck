import { Router } from "express";
import { cancelSms, getSmsHistory, scheduleSms, sendSms, sendTestSms } from "../controllers/smsController.js";

export const smsRoutes = Router();

smsRoutes.post("/send", sendSms);
smsRoutes.post("/schedule", scheduleSms);
smsRoutes.get("/history", getSmsHistory);
smsRoutes.patch("/:id/cancel", cancelSms);
smsRoutes.post("/test", sendTestSms);
