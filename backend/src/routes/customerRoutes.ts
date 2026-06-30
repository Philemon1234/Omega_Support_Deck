import { Router } from "express";
import { addCustomer, deleteCustomer, getCustomers, importCustomers, updateCustomer } from "../controllers/customerController.js";

export const customerRoutes = Router();

customerRoutes.get("/", getCustomers);
customerRoutes.post("/", addCustomer);
customerRoutes.post("/import", importCustomers);
customerRoutes.put("/:id", updateCustomer);
customerRoutes.delete("/:id", deleteCustomer);
