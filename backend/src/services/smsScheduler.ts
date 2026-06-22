import cron from "node-cron";
import { readStore, writeStore } from "../config/db.js";
import { sendSmsViaUgSms } from "./ugSmsService.js";

let running = false;

async function processDueMessages() {
  if (running) return;
  running = true;

  try {
    const store = readStore();
    const dueMessages = store.smsMessages.filter(
      (message) => message.status === "scheduled" && message.scheduledAt && new Date(message.scheduledAt).getTime() <= Date.now(),
    );

    for (const message of dueMessages) {
      const latest = readStore();
      const latestMessage = latest.smsMessages.find((sms) => sms.id === message.id);
      if (!latestMessage || latestMessage.status !== "scheduled") continue;
      if (latestMessage.createdAt.startsWith("2025-")) continue;

      const recipients =
        latestMessage.recipientType === "single" && latestMessage.recipientCustomerId
          ? latest.customers.filter((customer) => customer.id === latestMessage.recipientCustomerId)
          : latestMessage.recipientType === "selected"
            ? latest.smsRecipients
                .filter((recipient) => recipient.smsMessageId === latestMessage.id)
                .map((recipient) => latest.customers.find((customer) => customer.id === recipient.customerId))
                .filter((customer): customer is NonNullable<typeof customer> => Boolean(customer))
            : latest.customers;

      const result = await sendSmsViaUgSms({
        numbers: recipients.map((customer) => customer.phoneNumber),
        message: latestMessage.messageBody,
      });

      latestMessage.status = result.success ? "sent" : "failed";
      latestMessage.sentAt = new Date().toISOString();
      latestMessage.validRecipients = result.validNumbers.length;
      latestMessage.invalidRecipients = result.invalidNumbers.length;
      latestMessage.totalRecipients = recipients.length;
      latestMessage.providerResponse = result.rawResponse ?? null;
      latestMessage.errorMessage = result.errorMessage ?? null;

      writeStore(latest);
    }
  } finally {
    running = false;
  }
}

export function startSmsScheduler() {
  cron.schedule("* * * * *", processDueMessages);
}
