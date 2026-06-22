import { nextId, readStore, writeStore, type CustomerRecord, type RecipientType, type SmsMessageRecord, type SmsRecipientRecord, type SmsStatus } from "../config/db.js";

export type CreateSmsLogParams = {
  messageBody: string;
  sendType: "immediate" | "scheduled" | "test";
  recipientType: RecipientType;
  recipientCustomerId?: number | null;
  status: SmsStatus;
  totalRecipients: number;
  validRecipients: number;
  invalidRecipients: number;
  scheduledAt?: string | null;
  sentAt?: string | null;
  providerResponse?: string | null;
  errorMessage?: string | null;
  recipients: Array<{ customer?: CustomerRecord | null; phoneNumber: string; status: SmsStatus; errorMessage?: string | null }>;
};

export function createSmsLog(params: CreateSmsLogParams) {
  const store = readStore();
  const createdAt = new Date().toISOString();
  const message: SmsMessageRecord = {
    id: nextId(store.smsMessages),
    messageBody: params.messageBody,
    sendType: params.sendType,
    recipientType: params.recipientType,
    recipientCustomerId: params.recipientCustomerId ?? null,
    status: params.status,
    totalRecipients: params.totalRecipients,
    validRecipients: params.validRecipients,
    invalidRecipients: params.invalidRecipients,
    scheduledAt: params.scheduledAt ?? null,
    sentAt: params.sentAt ?? null,
    provider: "UGSMS",
    providerResponse: params.providerResponse ?? null,
    errorMessage: params.errorMessage ?? null,
    createdAt,
  };

  const nextRecipientId = nextId(store.smsRecipients);
  const recipients: SmsRecipientRecord[] = params.recipients.map((recipient, index) => ({
    id: nextRecipientId + index,
    smsMessageId: message.id,
    customerId: recipient.customer?.id ?? null,
    phoneNumber: recipient.phoneNumber,
    status: recipient.status,
    errorMessage: recipient.errorMessage ?? null,
    createdAt,
  }));

  store.smsMessages.unshift(message);
  store.smsRecipients.unshift(...recipients);
  writeStore(store);
  return message;
}

export function listSmsHistory(limit = 50) {
  return readStore().smsMessages.slice(0, limit);
}

export function cancelScheduledSms(id: number) {
  const store = readStore();
  const message = store.smsMessages.find((sms) => sms.id === id);
  if (!message) return { ok: false, message: "SMS record not found." };
  if (message.status !== "scheduled") return { ok: false, message: "Only scheduled SMS messages can be cancelled." };
  message.status = "cancelled";
  writeStore(store);
  return { ok: true, message };
}
