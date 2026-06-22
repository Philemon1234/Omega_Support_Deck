import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type CustomerRecord = {
  id: number;
  name: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
};

export type SmsStatus = "sent" | "scheduled" | "failed" | "cancelled";
export type RecipientType = "all" | "single" | "selected" | "test";

export type SmsMessageRecord = {
  id: number;
  messageBody: string;
  sendType: "immediate" | "scheduled" | "test";
  recipientType: RecipientType;
  recipientCustomerId: number | null;
  status: SmsStatus;
  totalRecipients: number;
  validRecipients: number;
  invalidRecipients: number;
  scheduledAt: string | null;
  sentAt: string | null;
  provider: "UGSMS";
  providerResponse: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type SmsRecipientRecord = {
  id: number;
  smsMessageId: number;
  customerId: number | null;
  phoneNumber: string;
  status: SmsStatus;
  errorMessage: string | null;
  createdAt: string;
};

type Store = {
  customers: CustomerRecord[];
  smsMessages: SmsMessageRecord[];
  smsRecipients: SmsRecipientRecord[];
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");
const storePath = path.join(dataDir, "store.json");

const now = "2025-05-20T09:15:00.000Z";
const initialStore: Store = {
  customers: [
    { id: 1, name: "John Ssekibuuka", phoneNumber: "+256712345678", createdAt: now, updatedAt: now },
    { id: 2, name: "Annet Nabaasa", phoneNumber: "+256775234567", createdAt: now, updatedAt: now },
    { id: 3, name: "David Kato", phoneNumber: "+256701234567", createdAt: now, updatedAt: now },
    { id: 4, name: "Faith Namuyiga", phoneNumber: "+256782345678", createdAt: now, updatedAt: now },
    { id: 5, name: "Moses Okello", phoneNumber: "+256703456789", createdAt: now, updatedAt: now },
    { id: 6, name: "Gloria Nantume", phoneNumber: "+256777123456", createdAt: now, updatedAt: now },
    { id: 7, name: "Patrick Mugisha", phoneNumber: "+256756789012", createdAt: now, updatedAt: now },
    { id: 8, name: "Sarah Awori", phoneNumber: "+256709876543", createdAt: now, updatedAt: now },
  ],
  smsMessages: [
    {
      id: 1,
      messageBody: "Network Maintenance",
      sendType: "immediate",
      recipientType: "all",
      recipientCustomerId: null,
      status: "sent",
      totalRecipients: 312,
      validRecipients: 312,
      invalidRecipients: 0,
      scheduledAt: null,
      sentAt: "2025-05-20T09:15:00.000Z",
      provider: "UGSMS",
      providerResponse: null,
      errorMessage: null,
      createdAt: "2025-05-20T09:15:00.000Z",
    },
    {
      id: 2,
      messageBody: "Service Restored",
      sendType: "immediate",
      recipientType: "all",
      recipientCustomerId: null,
      status: "sent",
      totalRecipients: 298,
      validRecipients: 298,
      invalidRecipients: 0,
      scheduledAt: null,
      sentAt: "2025-05-20T10:45:00.000Z",
      provider: "UGSMS",
      providerResponse: null,
      errorMessage: null,
      createdAt: "2025-05-20T10:45:00.000Z",
    },
    {
      id: 3,
      messageBody: "Weekend Offer",
      sendType: "scheduled",
      recipientType: "all",
      recipientCustomerId: null,
      status: "scheduled",
      totalRecipients: 420,
      validRecipients: 420,
      invalidRecipients: 0,
      scheduledAt: "2026-12-31T15:00:00.000Z",
      sentAt: null,
      provider: "UGSMS",
      providerResponse: null,
      errorMessage: null,
      createdAt: "2025-05-20T11:00:00.000Z",
    },
    {
      id: 4,
      messageBody: "Promotional Offer",
      sendType: "immediate",
      recipientType: "all",
      recipientCustomerId: null,
      status: "failed",
      totalRecipients: 87,
      validRecipients: 87,
      invalidRecipients: 0,
      scheduledAt: null,
      sentAt: "2025-05-18T17:20:00.000Z",
      provider: "UGSMS",
      providerResponse: null,
      errorMessage: "Provider rejected the request.",
      createdAt: "2025-05-18T17:20:00.000Z",
    },
  ],
  smsRecipients: [],
};

function ensureStore() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(storePath)) writeFileSync(storePath, JSON.stringify(initialStore, null, 2));
}

export function readStore(): Store {
  ensureStore();
  const store = JSON.parse(readFileSync(storePath, "utf8")) as Store;
  let changed = false;

  store.smsMessages.forEach((message) => {
    if (message.status === "scheduled" && message.createdAt.startsWith("2025-") && message.scheduledAt) {
      message.scheduledAt = "2026-12-31T15:00:00.000Z";
      changed = true;
    }
  });

  if (changed) {
    writeStore(store);
  }

  return store;
}

export function writeStore(store: Store) {
  ensureStore();
  writeFileSync(storePath, JSON.stringify(store, null, 2));
}

export function nextId(items: Array<{ id: number }>) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}
