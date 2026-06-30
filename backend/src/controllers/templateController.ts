import type { Request, Response } from "express";
import {
  createTemplate,
  deleteTemplateRecord,
  listTemplates,
  updateTemplateRecord,
  type TemplateCategory,
} from "../config/db.js";

const categories = new Set<TemplateCategory>(["maintenance", "offer", "service", "payment", "general"]);

function serializeTemplate(template: Awaited<ReturnType<typeof listTemplates>>[number]) {
  return {
    id: template.id,
    title: template.title,
    category: template.category,
    message: template.message,
    createdAt: template.createdAt,
  };
}

function parseTemplateBody(body: Request["body"]) {
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "general") as TemplateCategory;
  const message = String(body.message ?? "").trim();

  if (!title) return { error: "Template title is required." };
  if (!message) return { error: "Template message is required." };
  if (!categories.has(category)) return { error: "Template category is invalid." };

  return { title, category, message };
}

export async function getTemplates(_req: Request, res: Response) {
  res.json({ success: true, data: (await listTemplates()).map(serializeTemplate) });
}

export async function addTemplate(req: Request, res: Response) {
  const parsed = parseTemplateBody(req.body);
  if ("error" in parsed) return res.status(400).json({ success: false, message: parsed.error });

  const template = await createTemplate(parsed);
  res.status(201).json({ success: true, data: serializeTemplate(template) });
}

export async function updateTemplate(req: Request, res: Response) {
  const parsed = parseTemplateBody(req.body);
  if ("error" in parsed) return res.status(400).json({ success: false, message: parsed.error });

  const template = await updateTemplateRecord(String(req.params.id), parsed);
  if (!template) return res.status(404).json({ success: false, message: "Template not found." });
  res.json({ success: true, data: serializeTemplate(template) });
}

export async function deleteTemplate(req: Request, res: Response) {
  const deleted = await deleteTemplateRecord(String(req.params.id));
  if (!deleted) return res.status(404).json({ success: false, message: "Template not found." });
  res.json({ success: true });
}
