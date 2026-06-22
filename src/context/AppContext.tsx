import { createContext, useCallback, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import * as api from "../services/api";
import type { ImportedCustomerRow } from "../utils/csvImport";

export type Customer = {
  id: number;
  name: string;
  phone: string;
  dateAdded: string;
};

export type SmsStatus = "Sent" | "Scheduled" | "Failed" | "Cancelled";

export type SmsActivity = {
  id: number;
  message: string;
  recipients: number;
  status: SmsStatus;
  dateTime: string;
};

type AddCustomerResult = { ok: true } | { ok: false; error: string };
type UpdateCustomerResult = { ok: true } | { ok: false; error: string };
type SmsResult = { ok: true; message: string } | { ok: false; error: string };

export type SmsTemplate = {
  id: string;
  title: string;
  category: "maintenance" | "offer" | "service" | "payment" | "general";
  message: string;
  createdAt: string;
};

export type ImportCustomersSummary = {
  added: number;
  duplicates: number;
  invalid: number;
  duplicatePhones: string[];
};

type AppContextValue = {
  customers: Customer[];
  smsActivities: SmsActivity[];
  dashboardStats: api.DashboardStats;
  smsTemplates: SmsTemplate[];
  selectedCustomerIds: number[];
  isLoading: boolean;
  apiError: string | null;
  refreshCustomers: (search?: string) => Promise<void>;
  refreshSmsHistory: () => Promise<void>;
  refreshDashboardStats: () => Promise<void>;
  addCustomer: (name: string, phone: string) => Promise<AddCustomerResult>;
  importCustomers: (rows: Array<ImportedCustomerRow | null>) => Promise<ImportCustomersSummary>;
  deleteCustomer: (id: number) => Promise<void>;
  deleteCustomersBulk: (ids: number[]) => Promise<void>;
  updateCustomer: (id: number, name: string, phone: string) => Promise<UpdateCustomerResult>;
  setSelectedCustomerIds: Dispatch<SetStateAction<number[]>>;
  sendSmsNow: (message: string, recipientType: "all" | "single" | "selected", customerId?: number, customerIds?: number[]) => Promise<SmsResult>;
  sendTestSms: (phoneNumber: string, message: string) => Promise<SmsResult>;
  scheduleSms: (message: string, recipientType: "all" | "single" | "selected", scheduledAt: string, customerId?: number, customerIds?: number[]) => Promise<SmsResult>;
  addTemplate: (template: Omit<SmsTemplate, "id" | "createdAt">) => { ok: true } | { ok: false; error: string };
  updateTemplate: (id: string, template: Omit<SmsTemplate, "id" | "createdAt">) => { ok: true } | { ok: false; error: string };
  deleteTemplate: (id: string) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);
const TEMPLATE_KEY = "omega_sms_templates";

const defaultTemplates: SmsTemplate[] = [
  {
    id: "maintenance-notice",
    title: "Maintenance Notice",
    category: "maintenance",
    message: "Dear customer, our Wi-Fi service will be under maintenance on [DATE] from [START_TIME] to [END_TIME]. Please plan ahead. Thank you.",
    createdAt: new Date("2026-01-01T08:00:00.000Z").toISOString(),
  },
  {
    id: "service-restored",
    title: "Service Restored",
    category: "service",
    message: "Dear customer, Omega Wi-Fi service has been restored. Thank you for your patience.",
    createdAt: new Date("2026-01-01T08:05:00.000Z").toISOString(),
  },
  {
    id: "weekend-offer",
    title: "Weekend Offer",
    category: "offer",
    message: "Dear customer, enjoy our weekend Wi-Fi offer. Get [OFFER_DETAILS]. Valid until [DATE].",
    createdAt: new Date("2026-01-01T08:10:00.000Z").toISOString(),
  },
  {
    id: "payment-reminder",
    title: "Payment Reminder",
    category: "payment",
    message: "Dear customer, your Wi-Fi package is about to expire. Please renew to continue enjoying Omega Wi-Fi.",
    createdAt: new Date("2026-01-01T08:15:00.000Z").toISOString(),
  },
  {
    id: "general-announcement",
    title: "General Announcement",
    category: "general",
    message: "Dear customer, we have an important update from Omega Wi-Fi: [MESSAGE]",
    createdAt: new Date("2026-01-01T08:20:00.000Z").toISOString(),
  },
];

function loadTemplates() {
  try {
    const stored = localStorage.getItem(TEMPLATE_KEY);
    return stored ? (JSON.parse(stored) as SmsTemplate[]) : defaultTemplates;
  } catch {
    return defaultTemplates;
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(value))
    .replace(",", "");
}

function mapCustomer(customer: api.ApiCustomer): Customer {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phoneNumber,
    dateAdded: formatDateTime(customer.createdAt),
  };
}

function mapSmsStatus(status: api.ApiSmsStatus): SmsStatus {
  if (status === "scheduled") return "Scheduled";
  if (status === "failed") return "Failed";
  if (status === "cancelled") return "Cancelled";
  return "Sent";
}

function mapSms(message: api.ApiSmsMessage): SmsActivity {
  return {
    id: message.id,
    message: message.messageBody.length > 32 ? `${message.messageBody.slice(0, 32)}...` : message.messageBody,
    recipients: message.totalRecipients,
    status: mapSmsStatus(message.status),
    dateTime: formatDateTime(message.sentAt ?? message.scheduledAt ?? message.createdAt),
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [smsActivities, setSmsActivities] = useState<SmsActivity[]>([]);
  const [dashboardStats, setDashboardStats] = useState<api.DashboardStats>({
    totalCustomers: 0,
    smsSent: 0,
    scheduledSms: 0,
    failedSms: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>(loadTemplates);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(smsTemplates));
  }, [smsTemplates]);

  const refreshCustomers = useCallback(async (search?: string) => {
    try {
      const data = await api.fetchCustomers(search);
      setCustomers(data.map(mapCustomer));
      setApiError(null);
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
      throw error;
    }
  }, []);

  const refreshSmsHistory = useCallback(async () => {
    try {
      const data = await api.fetchSmsHistory();
      setSmsActivities(data.map(mapSms));
      setApiError(null);
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
      throw error;
    }
  }, []);

  const refreshDashboardStats = useCallback(async () => {
    try {
      setDashboardStats(await api.fetchDashboardStats());
      setApiError(null);
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
      throw error;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshCustomers(), refreshSmsHistory(), refreshDashboardStats()]);
  }, [refreshCustomers, refreshDashboardStats, refreshSmsHistory]);

  useEffect(() => {
    refreshAll()
      .catch((error) => console.error(getErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [refreshAll]);

  const addCustomer = async (name: string, phone: string): Promise<AddCustomerResult> => {
    try {
      await api.addCustomer({ name, phoneNumber: phone });
      await Promise.all([refreshCustomers(), refreshDashboardStats()]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  };

  const importCustomers = async (rows: Array<ImportedCustomerRow | null>): Promise<ImportCustomersSummary> => {
    const existingPhones = new Set(customers.map((customer) => customer.phone));
    const seenPhones = new Set<string>();
    const duplicatePhones: string[] = [];
    let invalid = 0;
    let added = 0;

    for (const row of rows) {
      if (!row) {
        invalid += 1;
        continue;
      }

      if (existingPhones.has(row.phone) || seenPhones.has(row.phone)) {
        duplicatePhones.push(row.phone);
        continue;
      }

      seenPhones.add(row.phone);
      try {
        await api.addCustomer({ name: row.name, phoneNumber: row.phone });
        added += 1;
      } catch (error) {
        const message = getErrorMessage(error);
        if (message.includes("already registered")) {
          duplicatePhones.push(row.phone);
        } else {
          invalid += 1;
        }
      }
    }

    await Promise.all([refreshCustomers(), refreshDashboardStats()]);
    return { added, duplicates: duplicatePhones.length, invalid, duplicatePhones: Array.from(new Set(duplicatePhones)) };
  };

  const deleteCustomer = async (id: number) => {
    await api.deleteCustomer(id);
    setSelectedCustomerIds((current) => current.filter((customerId) => customerId !== id));
    await Promise.all([refreshCustomers(), refreshDashboardStats()]);
  };

  const deleteCustomersBulk = async (ids: number[]) => {
    await Promise.all(ids.map((id) => api.deleteCustomer(id)));
    setSelectedCustomerIds((current) => current.filter((customerId) => !ids.includes(customerId)));
    await Promise.all([refreshCustomers(), refreshDashboardStats()]);
  };

  const updateCustomer = async (id: number, name: string, phone: string): Promise<UpdateCustomerResult> => {
    try {
      await api.updateCustomer(id, { name, phoneNumber: phone });
      await refreshCustomers();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  };

  const sendSmsNow = async (message: string, recipientType: "all" | "single" | "selected", customerId?: number, customerIds?: number[]): Promise<SmsResult> => {
    try {
      const response = await api.sendSms({ recipientType, customerId, customerIds, messageBody: message });
      await Promise.all([refreshSmsHistory(), refreshDashboardStats()]);
      return { ok: true, message: response.message };
    } catch (error) {
      await Promise.allSettled([refreshSmsHistory(), refreshDashboardStats()]);
      return { ok: false, error: getErrorMessage(error) };
    }
  };

  const sendTestSms = async (phoneNumber: string, message: string): Promise<SmsResult> => {
    try {
      const response = await api.sendTestSms({ phoneNumber, messageBody: message });
      await Promise.all([refreshSmsHistory(), refreshDashboardStats()]);
      return { ok: true, message: response.message };
    } catch (error) {
      await Promise.allSettled([refreshSmsHistory(), refreshDashboardStats()]);
      return { ok: false, error: getErrorMessage(error) };
    }
  };

  const scheduleSms = async (message: string, recipientType: "all" | "single" | "selected", scheduledAt: string, customerId?: number, customerIds?: number[]): Promise<SmsResult> => {
    try {
      const response = await api.scheduleSms({ recipientType, customerId, customerIds, messageBody: message, scheduledAt });
      await Promise.all([refreshSmsHistory(), refreshDashboardStats()]);
      return { ok: true, message: response.message };
    } catch (error) {
      await Promise.allSettled([refreshSmsHistory(), refreshDashboardStats()]);
      return { ok: false, error: getErrorMessage(error) };
    }
  };

  const addTemplate = (template: Omit<SmsTemplate, "id" | "createdAt">) => {
    if (!template.title.trim()) return { ok: false as const, error: "Template title is required." };
    if (!template.message.trim()) return { ok: false as const, error: "Template message is required." };
    setSmsTemplates((current) => [
      {
        ...template,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: template.title.trim(),
        message: template.message.trim(),
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    return { ok: true as const };
  };

  const updateTemplate = (id: string, template: Omit<SmsTemplate, "id" | "createdAt">) => {
    if (!template.title.trim()) return { ok: false as const, error: "Template title is required." };
    if (!template.message.trim()) return { ok: false as const, error: "Template message is required." };
    setSmsTemplates((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              title: template.title.trim(),
              category: template.category,
              message: template.message.trim(),
            }
          : item,
      ),
    );
    return { ok: true as const };
  };

  const deleteTemplate = (id: string) => {
    setSmsTemplates((current) => current.filter((template) => template.id !== id));
  };

  const value = useMemo(
    () => ({
      customers,
      smsActivities,
      dashboardStats,
      smsTemplates,
      selectedCustomerIds,
      isLoading,
      apiError,
      refreshCustomers,
      refreshSmsHistory,
      refreshDashboardStats,
      addCustomer,
      importCustomers,
      deleteCustomer,
      deleteCustomersBulk,
      updateCustomer,
      setSelectedCustomerIds,
      sendSmsNow,
      sendTestSms,
      scheduleSms,
      addTemplate,
      updateTemplate,
      deleteTemplate,
    }),
    [apiError, customers, dashboardStats, isLoading, refreshCustomers, refreshDashboardStats, refreshSmsHistory, selectedCustomerIds, smsActivities, smsTemplates],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}
