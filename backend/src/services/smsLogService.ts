import {
  createSmsMessage,
  createSmsRecipients,
  getSmsMessageById,
  listSmsMessages,
  updateSmsMessage,
  type CustomerRecord,
  type RecipientType,
  type SmsStatus,
} from "../config/db.js";

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

export async function createSmsLog(params: CreateSmsLogParams) {
  const message = await createSmsMessage({
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
    providerResponse: params.providerResponse ?? null,
    errorMessage: params.errorMessage ?? null,
  });

  await createSmsRecipients(params.recipients.map((recipient) => ({
    smsMessageId: message.id,
    customerId: recipient.customer?.id ?? null,
    phoneNumber: recipient.phoneNumber,
    status: recipient.status,
    errorMessage: recipient.errorMessage ?? null,
  })));

  return message;
}

export function listSmsHistory(limit = 50) {
  return listSmsMessages(limit);
}

export async function cancelScheduledSms(id: number) {
  const message = await getSmsMessageById(id);
  if (!message) return { ok: false, message: "SMS record not found." };
  if (message.status !== "scheduled") return { ok: false, message: "Only scheduled SMS messages can be cancelled." };
  const updatedMessage = await updateSmsMessage(id, { status: "cancelled" });
  return { ok: true, message: updatedMessage };
}
