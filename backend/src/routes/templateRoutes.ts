import { Router } from "express";
import { addTemplate, deleteTemplate, getTemplates, updateTemplate } from "../controllers/templateController.js";

export const templateRoutes = Router();

templateRoutes.get("/", getTemplates);
templateRoutes.post("/", addTemplate);
templateRoutes.put("/:id", updateTemplate);
templateRoutes.delete("/:id", deleteTemplate);
