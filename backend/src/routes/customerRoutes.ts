import { Router } from "express";
import { addCustomer, deleteCustomer, getCustomers, updateCustomer } from "../controllers/customerController.js";

export const customerRoutes = Router();

customerRoutes.get("/", getCustomers);
customerRoutes.post("/", addCustomer);
customerRoutes.put("/:id", updateCustomer);
customerRoutes.delete("/:id", deleteCustomer);
