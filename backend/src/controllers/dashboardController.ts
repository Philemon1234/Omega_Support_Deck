import type { Request, Response } from "express";
import { readStore } from "../config/db.js";

export function getDashboardStats(_req: Request, res: Response) {
  const store = readStore();
  res.json({
    success: true,
    data: {
      totalCustomers: store.customers.length,
      smsSent: store.smsMessages.filter((sms) => sms.status === "sent").length,
      scheduledSms: store.smsMessages.filter((sms) => sms.status === "scheduled").length,
      failedSms: store.smsMessages.filter((sms) => sms.status === "failed").length,
    },
  });
}
