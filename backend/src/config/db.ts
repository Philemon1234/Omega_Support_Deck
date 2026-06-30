import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export type CustomerRecord = {
  id: number;
  name: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
};

export type SmsStatus = "sent" | "scheduled" | "failed" | "cancelled";
export type RecipientType = "all" | "single" | "selected" | "test";
export type TemplateCategory = "maintenance" | "offer" | "service" | "payment" | "general";

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

export type SmsTemplateRecord = {
  id: string;
  title: string;
  category: TemplateCategory;
  message: string;
  createdAt: string;
  updatedAt: string;
};

type CustomerRow = {
  id: number;
  name: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
};

type SmsMessageRow = {
  id: number;
  message_body: string;
  send_type: "immediate" | "scheduled" | "test";
  recipient_type: RecipientType;
  recipient_customer_id: number | null;
  status: SmsStatus;
  total_recipients: number;
  valid_recipients: number;
  invalid_recipients: number;
  scheduled_at: string | null;
  sent_at: string | null;
  provider: "UGSMS";
  provider_response: string | null;
  error_message: string | null;
  created_at: string;
};

type SmsRecipientRow = {
  id: number;
  sms_message_id: number;
  customer_id: number | null;
  phone_number: string;
  status: SmsStatus;
  error_message: string | null;
  created_at: string;
};

type SmsTemplateRow = {
  id: string;
  title: string;
  category: TemplateCategory;
  message: string;
  created_at: string;
  updated_at: string;
};

export class DuplicatePhoneError extends Error {
  constructor() {
    super("This phone number is already registered in the system.");
  }
}

function assertSupabaseConfigured() {
  if (
    !env.supabaseUrl ||
    !env.supabaseServiceRoleKey ||
    env.supabaseUrl.includes("your_supabase") ||
    env.supabaseServiceRoleKey.includes("your_supabase")
  ) {
    throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.");
  }
}

assertSupabaseConfigured();

const supabaseUrl = env.supabaseUrl as string;
const supabaseServiceRoleKey = env.supabaseServiceRoleKey as string;

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function mapCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    name: row.name,
    phoneNumber: row.phone_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSmsMessage(row: SmsMessageRow): SmsMessageRecord {
  return {
    id: row.id,
    messageBody: row.message_body,
    sendType: row.send_type,
    recipientType: row.recipient_type,
    recipientCustomerId: row.recipient_customer_id,
    status: row.status,
    totalRecipients: row.total_recipients,
    validRecipients: row.valid_recipients,
    invalidRecipients: row.invalid_recipients,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    provider: row.provider,
    providerResponse: row.provider_response,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

function mapSmsRecipient(row: SmsRecipientRow): SmsRecipientRecord {
  return {
    id: row.id,
    smsMessageId: row.sms_message_id,
    customerId: row.customer_id,
    phoneNumber: row.phone_number,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

function mapTemplate(row: SmsTemplateRow): SmsTemplateRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function throwIfError(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "23505") throw new DuplicatePhoneError();
  throw new Error(error.message);
}

export async function listCustomers(search = "") {
  const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
  throwIfError(error);

  const query = search.trim().toLowerCase();
  return (data as CustomerRow[])
    .map(mapCustomer)
    .filter((customer) => !query || customer.name.toLowerCase().includes(query) || customer.phoneNumber.toLowerCase().includes(query));
}

export async function getCustomersByIds(ids: number[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from("customers").select("*").in("id", ids);
  throwIfError(error);
  const order = new Map(ids.map((id, index) => [id, index]));
  return (data as CustomerRow[]).map(mapCustomer).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getCustomerById(id: number) {
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  throwIfError(error);
  return data ? mapCustomer(data as CustomerRow) : null;
}

export async function createCustomer(input: { name: string; phoneNumber: string }) {
  const { data, error } = await supabase
    .from("customers")
    .insert({ name: input.name, phone_number: input.phoneNumber })
    .select("*")
    .single();
  throwIfError(error);
  return mapCustomer(data as CustomerRow);
}

export async function updateCustomerRecord(id: number, input: { name: string; phoneNumber: string }) {
  const { data, error } = await supabase
    .from("customers")
    .update({ name: input.name, phone_number: input.phoneNumber, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  throwIfError(error);
  return data ? mapCustomer(data as CustomerRow) : null;
}

export async function deleteCustomerRecord(id: number) {
  const { error, count } = await supabase.from("customers").delete({ count: "exact" }).eq("id", id);
  throwIfError(error);
  return (count ?? 0) > 0;
}

export async function importCustomerRows(rows: Array<{ name: string; phoneNumber: string }>) {
  const uniqueRows: Array<{ name: string; phoneNumber: string }> = [];
  const seenPhones = new Set<string>();
  const duplicatePhones: string[] = [];

  rows.forEach((row) => {
    if (seenPhones.has(row.phoneNumber)) {
      duplicatePhones.push(row.phoneNumber);
      return;
    }
    seenPhones.add(row.phoneNumber);
    uniqueRows.push(row);
  });

  if (!uniqueRows.length) {
    return { added: 0, duplicates: duplicatePhones.length, duplicatePhones };
  }

  const phones = uniqueRows.map((row) => row.phoneNumber);
  const { data: existingData, error: existingError } = await supabase.from("customers").select("phone_number").in("phone_number", phones);
  throwIfError(existingError);

  const existingPhones = new Set((existingData as Pick<CustomerRow, "phone_number">[]).map((row) => row.phone_number));
  const rowsToInsert = uniqueRows.filter((row) => {
    if (!existingPhones.has(row.phoneNumber)) return true;
    duplicatePhones.push(row.phoneNumber);
    return false;
  });

  if (!rowsToInsert.length) {
    return { added: 0, duplicates: duplicatePhones.length, duplicatePhones };
  }

  const { data, error } = await supabase
    .from("customers")
    .upsert(
      rowsToInsert.map((row) => ({ name: row.name, phone_number: row.phoneNumber })),
      { onConflict: "phone_number", ignoreDuplicates: true },
    )
    .select("phone_number");
  throwIfError(error);

  const insertedPhones = new Set((data as Pick<CustomerRow, "phone_number">[]).map((row) => row.phone_number));
  rowsToInsert.forEach((row) => {
    if (!insertedPhones.has(row.phoneNumber)) duplicatePhones.push(row.phoneNumber);
  });

  return { added: insertedPhones.size, duplicates: duplicatePhones.length, duplicatePhones };
}

export async function createSmsMessage(input: Omit<SmsMessageRecord, "id" | "createdAt" | "provider">) {
  const { data, error } = await supabase
    .from("sms_messages")
    .insert({
      message_body: input.messageBody,
      send_type: input.sendType,
      recipient_type: input.recipientType,
      recipient_customer_id: input.recipientCustomerId,
      status: input.status,
      total_recipients: input.totalRecipients,
      valid_recipients: input.validRecipients,
      invalid_recipients: input.invalidRecipients,
      scheduled_at: input.scheduledAt,
      sent_at: input.sentAt,
      provider: "UGSMS",
      provider_response: input.providerResponse,
      error_message: input.errorMessage,
    })
    .select("*")
    .single();
  throwIfError(error);
  return mapSmsMessage(data as SmsMessageRow);
}

export async function createSmsRecipients(recipients: Array<Omit<SmsRecipientRecord, "id" | "createdAt">>) {
  if (!recipients.length) return [];
  const { data, error } = await supabase
    .from("sms_recipients")
    .insert(
      recipients.map((recipient) => ({
        sms_message_id: recipient.smsMessageId,
        customer_id: recipient.customerId,
        phone_number: recipient.phoneNumber,
        status: recipient.status,
        error_message: recipient.errorMessage,
      })),
    )
    .select("*");
  throwIfError(error);
  return (data as SmsRecipientRow[]).map(mapSmsRecipient);
}

export async function listSmsMessages(limit = 50) {
  const { data, error } = await supabase.from("sms_messages").select("*").order("created_at", { ascending: false }).limit(limit);
  throwIfError(error);
  return (data as SmsMessageRow[]).map(mapSmsMessage);
}

export async function listDueScheduledSmsMessages() {
  const { data, error } = await supabase
    .from("sms_messages")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true });
  throwIfError(error);
  return (data as SmsMessageRow[]).map(mapSmsMessage);
}

export async function getSmsMessageById(id: number) {
  const { data, error } = await supabase.from("sms_messages").select("*").eq("id", id).maybeSingle();
  throwIfError(error);
  return data ? mapSmsMessage(data as SmsMessageRow) : null;
}

export async function listSmsRecipientsByMessageId(smsMessageId: number) {
  const { data, error } = await supabase.from("sms_recipients").select("*").eq("sms_message_id", smsMessageId);
  throwIfError(error);
  return (data as SmsRecipientRow[]).map(mapSmsRecipient);
}

export async function updateSmsMessage(id: number, input: Partial<SmsMessageRecord>) {
  const { data, error } = await supabase
    .from("sms_messages")
    .update({
      status: input.status,
      total_recipients: input.totalRecipients,
      valid_recipients: input.validRecipients,
      invalid_recipients: input.invalidRecipients,
      sent_at: input.sentAt,
      provider_response: input.providerResponse,
      error_message: input.errorMessage,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  throwIfError(error);
  return data ? mapSmsMessage(data as SmsMessageRow) : null;
}

export async function getDashboardStats() {
  const [customers, sent, scheduled, failed] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("sms_messages").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("sms_messages").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("sms_messages").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  [customers.error, sent.error, scheduled.error, failed.error].forEach(throwIfError);

  return {
    totalCustomers: customers.count ?? 0,
    smsSent: sent.count ?? 0,
    scheduledSms: scheduled.count ?? 0,
    failedSms: failed.count ?? 0,
  };
}

export async function listTemplates() {
  const { data, error } = await supabase.from("sms_templates").select("*").order("created_at", { ascending: false });
  throwIfError(error);
  return (data as SmsTemplateRow[]).map(mapTemplate);
}

export async function createTemplate(input: { title: string; category: TemplateCategory; message: string }) {
  const { data, error } = await supabase.from("sms_templates").insert(input).select("*").single();
  throwIfError(error);
  return mapTemplate(data as SmsTemplateRow);
}

export async function updateTemplateRecord(id: string, input: { title: string; category: TemplateCategory; message: string }) {
  const { data, error } = await supabase
    .from("sms_templates")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  throwIfError(error);
  return data ? mapTemplate(data as SmsTemplateRow) : null;
}

export async function deleteTemplateRecord(id: string) {
  const { error, count } = await supabase.from("sms_templates").delete({ count: "exact" }).eq("id", id);
  throwIfError(error);
  return (count ?? 0) > 0;
}
