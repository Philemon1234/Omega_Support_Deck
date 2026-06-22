import type { Request, Response } from "express";
import { nextId, readStore, writeStore } from "../config/db.js";
import { normalizeUgandanPhoneNumber } from "../utils/phone.js";

function serializeCustomer(customer: { id: number; name: string; phoneNumber: string; createdAt: string; updatedAt: string }) {
  return {
    id: customer.id,
    name: customer.name,
    phoneNumber: customer.phoneNumber,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export function getCustomers(req: Request, res: Response) {
  const search = String(req.query.search ?? "").trim().toLowerCase();
  const customers = readStore().customers
    .filter((customer) => !search || customer.name.toLowerCase().includes(search) || customer.phoneNumber.toLowerCase().includes(search))
    .map(serializeCustomer);

  res.json({ success: true, data: customers });
}

export function addCustomer(req: Request, res: Response) {
  const name = String(req.body.name ?? "").trim();
  const rawPhone = String(req.body.phoneNumber ?? req.body.phone ?? "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Customer name is required." });
  if (!rawPhone) return res.status(400).json({ success: false, message: "Phone number is required." });

  const phoneNumber = normalizeUgandanPhoneNumber(rawPhone);
  if (!phoneNumber) return res.status(400).json({ success: false, message: "Please enter a valid Ugandan phone number." });

  const store = readStore();
  if (store.customers.some((customer) => customer.phoneNumber === phoneNumber)) {
    return res.status(409).json({ success: false, message: "This phone number is already registered in the system." });
  }

  const timestamp = new Date().toISOString();
  const customer = { id: nextId(store.customers), name, phoneNumber, createdAt: timestamp, updatedAt: timestamp };
  store.customers.unshift(customer);
  writeStore(store);
  res.status(201).json({ success: true, data: serializeCustomer(customer) });
}

export function updateCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const name = String(req.body.name ?? "").trim();
  const rawPhone = String(req.body.phoneNumber ?? req.body.phone ?? "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Customer name is required." });
  if (!rawPhone) return res.status(400).json({ success: false, message: "Phone number is required." });

  const phoneNumber = normalizeUgandanPhoneNumber(rawPhone);
  if (!phoneNumber) return res.status(400).json({ success: false, message: "Please enter a valid Ugandan phone number." });

  const store = readStore();
  const customer = store.customers.find((item) => item.id === id);
  if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
  if (store.customers.some((item) => item.id !== id && item.phoneNumber === phoneNumber)) {
    return res.status(409).json({ success: false, message: "This phone number is already registered in the system." });
  }

  customer.name = name;
  customer.phoneNumber = phoneNumber;
  customer.updatedAt = new Date().toISOString();
  writeStore(store);
  res.json({ success: true, data: serializeCustomer(customer) });
}

export function deleteCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const store = readStore();
  const initialLength = store.customers.length;
  store.customers = store.customers.filter((customer) => customer.id !== id);
  if (store.customers.length === initialLength) return res.status(404).json({ success: false, message: "Customer not found." });
  writeStore(store);
  res.json({ success: true });
}
