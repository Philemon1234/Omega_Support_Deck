const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export type ApiCustomer = {
  id: number;
  name: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiSmsStatus = "sent" | "scheduled" | "failed" | "cancelled";

export type ApiSmsMessage = {
  id: number;
  messageBody: string;
  recipientType: "all" | "single" | "test";
  status: ApiSmsStatus;
  totalRecipients: number;
  validRecipients: number;
  invalidRecipients: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type DashboardStats = {
  totalCustomers: number;
  smsSent: number;
  scheduledSms: number;
  failedSms: number;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Backend API is not reachable. Start the backend with npm run dev:full or run cd backend && npm run dev.");
  }

  const data = await response.json().catch(() => ({ success: false, message: "Invalid server response." }));
  if (!response.ok || data.success === false) {
    throw new Error(data.message ?? data.error ?? "Request failed.");
  }
  return data as T;
}

export async function fetchCustomers(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await request<{ success: true; data: ApiCustomer[] }>(`/customers${query}`);
  return response.data;
}

export async function addCustomer(payload: { name: string; phoneNumber: string }) {
  const response = await request<{ success: true; data: ApiCustomer }>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function updateCustomer(id: number, payload: { name: string; phoneNumber: string }) {
  const response = await request<{ success: true; data: ApiCustomer }>(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function deleteCustomer(id: number) {
  await request<{ success: true }>(`/customers/${id}`, { method: "DELETE" });
}

export async function sendSms(payload: { recipientType: "all" | "single" | "selected"; customerId?: number; customerIds?: number[]; messageBody: string }) {
  return request<{ success: true; message: string; data: { smsId: number; status: string; mocked?: boolean; recipientsCount: number; invalidNumbers: string[] } }>("/sms/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function scheduleSms(payload: { recipientType: "all" | "single" | "selected"; customerId?: number; customerIds?: number[]; messageBody: string; scheduledAt: string }) {
  return request<{ success: true; message: string; data: { smsId: number; status: string; recipientsCount: number } }>("/sms/schedule", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchSmsHistory() {
  const response = await request<{ success: true; data: ApiSmsMessage[] }>("/sms/history");
  return response.data;
}

export async function cancelScheduledSms(id: number) {
  return request<{ success: true; message: string }>(`/sms/${id}/cancel`, { method: "PATCH" });
}

export async function sendTestSms(payload: { phoneNumber: string; messageBody: string }) {
  return request<{ success: boolean; message: string; data?: unknown; error?: string }>("/sms/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchDashboardStats() {
  const response = await request<{ success: true; data: DashboardStats }>("/dashboard/stats");
  return response.data;
}
