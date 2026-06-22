import type { Request, Response } from "express";
import { readStore, type CustomerRecord, type RecipientType } from "../config/db.js";
import { createSmsLog, cancelScheduledSms, listSmsHistory } from "../services/smsLogService.js";
import { sendSmsViaUgSms } from "../services/ugSmsService.js";
import { isFutureDate, toIsoOrNull } from "../utils/date.js";
import { normalizeUgandanPhoneNumber } from "../utils/phone.js";

function resolveRecipients(recipientType: RecipientType, customerId?: number, customerIds?: number[]) {
  const store = readStore();
  if (recipientType === "single") {
    return customerId ? store.customers.filter((customer) => customer.id === customerId) : [];
  }
  if (recipientType === "selected") {
    const selectedIds = new Set(customerIds ?? []);
    return store.customers.filter((customer) => selectedIds.has(customer.id));
  }
  return store.customers;
}

function getRecipientRequest(body: Request["body"]): { recipientType: "all" | "single" | "selected"; customerId?: number; customerIds?: number[]; error?: string } {
  if (body.recipientType === "selected") {
    if (!Array.isArray(body.customerIds) || body.customerIds.length === 0) {
      return { recipientType: "selected", error: "Please select at least one customer." };
    }
    const customerIds = body.customerIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0);
    if (!customerIds.length) {
      return { recipientType: "selected", error: "Please select at least one valid customer." };
    }
    return { recipientType: "selected", customerIds };
  }

  if (body.recipientType === "single") {
    return { recipientType: "single", customerId: body.customerId ? Number(body.customerId) : undefined };
  }

  return { recipientType: "all" };
}

function serializeSms(message: ReturnType<typeof listSmsHistory>[number]) {
  return {
    id: message.id,
    messageBody: message.messageBody,
    recipientType: message.recipientType,
    status: message.status,
    totalRecipients: message.totalRecipients,
    validRecipients: message.validRecipients,
    invalidRecipients: message.invalidRecipients,
    scheduledAt: message.scheduledAt,
    sentAt: message.sentAt,
    createdAt: message.createdAt,
  };
}

export async function sendSms(req: Request, res: Response) {
  const recipientRequest = getRecipientRequest(req.body);
  if (recipientRequest.error) return res.status(400).json({ success: false, message: recipientRequest.error });
  const { recipientType, customerId, customerIds } = recipientRequest;
  const messageBody = String(req.body.messageBody ?? "").trim();
  if (!messageBody) return res.status(400).json({ success: false, message: "SMS message is required." });

  const recipients = resolveRecipients(recipientType, customerId, customerIds);
  if (!recipients.length) return res.status(400).json({ success: false, message: "No recipients found." });

  const result = await sendSmsViaUgSms({ numbers: recipients.map((customer) => customer.phoneNumber), message: messageBody });
  const status = result.success ? "sent" : "failed";
  const sms = createSmsLog({
    messageBody,
    sendType: "immediate",
    recipientType,
    recipientCustomerId: recipientType === "single" ? customerId ?? null : null,
    status,
    totalRecipients: recipients.length,
    validRecipients: result.validNumbers.length,
    invalidRecipients: result.invalidNumbers.length,
    sentAt: new Date().toISOString(),
    providerResponse: result.rawResponse ?? null,
    errorMessage: result.errorMessage ?? null,
    recipients: recipients.map((customer) => ({ customer, phoneNumber: customer.phoneNumber, status })),
  });

  if (!result.success) {
    return res.status(502).json({ success: false, message: "SMS failed to send.", error: result.errorMessage ?? "Provider rejected the request." });
  }

  res.json({
    success: true,
    message: result.mocked ? "SMS sent successfully in mock mode." : "SMS sent successfully.",
    data: { smsId: sms.id, status: "sent", mocked: result.mocked, recipientsCount: result.recipientsCount, invalidNumbers: result.invalidNumbers },
  });
}

export function scheduleSms(req: Request, res: Response) {
  const recipientRequest = getRecipientRequest(req.body);
  if (recipientRequest.error) return res.status(400).json({ success: false, message: recipientRequest.error });
  const { recipientType, customerId, customerIds } = recipientRequest;
  const messageBody = String(req.body.messageBody ?? "").trim();
  const scheduledAt = String(req.body.scheduledAt ?? "").trim();

  if (!messageBody) return res.status(400).json({ success: false, message: "SMS message is required." });
  if (!scheduledAt || !isFutureDate(scheduledAt)) return res.status(400).json({ success: false, message: "Scheduled time must be in the future." });

  const recipients = resolveRecipients(recipientType, customerId, customerIds);
  if (!recipients.length) return res.status(400).json({ success: false, message: "No recipients found." });

  const sms = createSmsLog({
    messageBody,
    sendType: "scheduled",
    recipientType,
    recipientCustomerId: recipientType === "single" ? customerId ?? null : null,
    status: "scheduled",
    totalRecipients: recipients.length,
    validRecipients: recipients.length,
    invalidRecipients: 0,
    scheduledAt: toIsoOrNull(scheduledAt),
    recipients: recipients.map((customer) => ({ customer, phoneNumber: customer.phoneNumber, status: "scheduled" })),
  });

  res.status(201).json({ success: true, message: "SMS scheduled successfully.", data: { smsId: sms.id, status: "scheduled", recipientsCount: recipients.length } });
}

export function getSmsHistory(_req: Request, res: Response) {
  res.json({ success: true, data: listSmsHistory().map(serializeSms) });
}

export function cancelSms(req: Request, res: Response) {
  const result = cancelScheduledSms(Number(req.params.id));
  if (!result.ok) return res.status(400).json({ success: false, message: result.message });
  res.json({ success: true, message: "Scheduled SMS cancelled.", data: result.message });
}

export async function sendTestSms(req: Request, res: Response) {
  const phoneNumber = normalizeUgandanPhoneNumber(String(req.body.phoneNumber ?? ""));
  const messageBody = String(req.body.messageBody ?? "").trim();
  if (!phoneNumber) return res.status(400).json({ success: false, message: "Please enter a valid Ugandan phone number." });
  if (!messageBody) return res.status(400).json({ success: false, message: "Message is required." });

  const testRecipient: CustomerRecord = { id: 0, name: "Test Recipient", phoneNumber, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const result = await sendSmsViaUgSms({ numbers: [phoneNumber], message: messageBody });
  const status = result.success ? "sent" : "failed";
  const sms = createSmsLog({
    messageBody,
    sendType: "test",
    recipientType: "test",
    status,
    totalRecipients: 1,
    validRecipients: result.validNumbers.length,
    invalidRecipients: result.invalidNumbers.length,
    sentAt: new Date().toISOString(),
    providerResponse: result.rawResponse ?? null,
    errorMessage: result.errorMessage ?? null,
    recipients: [{ customer: testRecipient, phoneNumber, status }],
  });

  res.status(result.success ? 200 : 502).json({
    success: result.success,
    message: result.success ? "Test SMS sent successfully." : "Test SMS failed to send.",
    data: { smsId: sms.id, mocked: result.mocked, provider: result.provider, httpStatus: result.httpStatus, rawResponse: result.rawResponse },
    error: result.errorMessage,
  });
}
