import type { SmsActivity } from "../context/AppContext";

export const mockSmsActivity: SmsActivity[] = [
  {
    id: 1,
    message: "Network Maintenance",
    recipients: 312,
    status: "Sent",
    dateTime: "May 20, 2025 09:15 AM",
  },
  {
    id: 2,
    message: "Service Restored",
    recipients: 298,
    status: "Sent",
    dateTime: "May 20, 2025 10:45 AM",
  },
  {
    id: 3,
    message: "Weekend Offer",
    recipients: 420,
    status: "Scheduled",
    dateTime: "May 21, 2025 06:00 PM",
  },
  {
    id: 4,
    message: "Payment Reminder",
    recipients: 156,
    status: "Sent",
    dateTime: "May 19, 2025 08:00 AM",
  },
  {
    id: 5,
    message: "Promotional Offer",
    recipients: 87,
    status: "Failed",
    dateTime: "May 18, 2025 05:20 PM",
  },
];
