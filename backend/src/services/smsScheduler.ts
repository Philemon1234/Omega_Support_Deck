import cron from "node-cron";
import { getCustomersByIds, getSmsMessageById, listCustomers, listDueScheduledSmsMessages, listSmsRecipientsByMessageId, updateSmsMessage } from "../config/db.js";
import { sendSmsViaUgSms } from "./ugSmsService.js";

let running = false;

async function processDueMessages() {
  if (running) return;
  running = true;

  try {
    const dueMessages = await listDueScheduledSmsMessages();

    for (const message of dueMessages) {
      const latestMessage = await getSmsMessageById(message.id);
      if (!latestMessage || latestMessage.status !== "scheduled") continue;

      const recipients =
        latestMessage.recipientType === "single" && latestMessage.recipientCustomerId
          ? await getCustomersByIds([latestMessage.recipientCustomerId])
          : latestMessage.recipientType === "selected"
            ? await getCustomersByIds(
                (await listSmsRecipientsByMessageId(latestMessage.id))
                  .map((recipient) => recipient.customerId)
                  .filter((customerId): customerId is number => Boolean(customerId)),
              )
            : await listCustomers();

      const result = await sendSmsViaUgSms({
        numbers: recipients.map((customer) => customer.phoneNumber),
        message: latestMessage.messageBody,
      });

      await updateSmsMessage(latestMessage.id, {
        status: result.success ? "sent" : "failed",
        sentAt: new Date().toISOString(),
        validRecipients: result.validNumbers.length,
        invalidRecipients: result.invalidNumbers.length,
        totalRecipients: recipients.length,
        providerResponse: result.rawResponse ?? null,
        errorMessage: result.errorMessage ?? null,
      });
    }
  } finally {
    running = false;
  }
}

export function startSmsScheduler() {
  cron.schedule("* * * * *", processDueMessages);
}
