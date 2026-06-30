import type { Request, Response } from "express";
import {
  DuplicatePhoneError,
  createCustomer,
  deleteCustomerRecord,
  importCustomerRows,
  listCustomers,
  updateCustomerRecord,
} from "../config/db.js";
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

export async function getCustomers(req: Request, res: Response) {
  const search = String(req.query.search ?? "").trim().toLowerCase();
  const customers = (await listCustomers(search)).map(serializeCustomer);

  res.json({ success: true, data: customers });
}

export async function addCustomer(req: Request, res: Response) {
  const name = String(req.body.name ?? "").trim();
  const rawPhone = String(req.body.phoneNumber ?? req.body.phone ?? "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Customer name is required." });
  if (!rawPhone) return res.status(400).json({ success: false, message: "Phone number is required." });

  const phoneNumber = normalizeUgandanPhoneNumber(rawPhone);
  if (!phoneNumber) return res.status(400).json({ success: false, message: "Please enter a valid Ugandan phone number." });

  try {
    const customer = await createCustomer({ name, phoneNumber });
    res.status(201).json({ success: true, data: serializeCustomer(customer) });
  } catch (error) {
    if (error instanceof DuplicatePhoneError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    throw error;
  }
}

export async function importCustomers(req: Request, res: Response) {
  const rows = (Array.isArray(req.body.customers) ? req.body.customers : []) as Array<{ name?: unknown; phoneNumber?: unknown; phone?: unknown } | null>;
  let invalid = 0;
  const validRows: Array<{ name: string; phoneNumber: string }> = [];

  rows.forEach((row) => {
    const name = String(row?.name ?? "").trim();
    const phoneNumber = normalizeUgandanPhoneNumber(String(row?.phoneNumber ?? row?.phone ?? ""));
    if (!name || !phoneNumber) {
      invalid += 1;
      return;
    }
    validRows.push({ name, phoneNumber });
  });

  const summary = await importCustomerRows(validRows);
  res.status(201).json({
    success: true,
    data: {
      added: summary.added,
      duplicates: summary.duplicates,
      invalid,
      duplicatePhones: Array.from(new Set(summary.duplicatePhones)),
    },
  });
}

export async function updateCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const name = String(req.body.name ?? "").trim();
  const rawPhone = String(req.body.phoneNumber ?? req.body.phone ?? "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Customer name is required." });
  if (!rawPhone) return res.status(400).json({ success: false, message: "Phone number is required." });

  const phoneNumber = normalizeUgandanPhoneNumber(rawPhone);
  if (!phoneNumber) return res.status(400).json({ success: false, message: "Please enter a valid Ugandan phone number." });

  try {
    const customer = await updateCustomerRecord(id, { name, phoneNumber });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.json({ success: true, data: serializeCustomer(customer) });
  } catch (error) {
    if (error instanceof DuplicatePhoneError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    throw error;
  }
}

export async function deleteCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const deleted = await deleteCustomerRecord(id);
  if (!deleted) return res.status(404).json({ success: false, message: "Customer not found." });
  res.json({ success: true });
}
