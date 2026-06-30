import type { Request, Response } from "express";
import { getDashboardStats as readDashboardStats } from "../config/db.js";

export async function getDashboardStats(_req: Request, res: Response) {
  res.json({
    success: true,
    data: await readDashboardStats(),
  });
}
