import { FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import type { SmsStatus } from "../../context/AppContext";

const styles: Record<SmsStatus, string> = {
  Sent: "bg-green-100 text-green-700",
  Scheduled: "bg-amber-100 text-amber-700",
  Failed: "bg-red-100 text-red-700",
  Cancelled: "bg-slate-100 text-slate-600",
};

const icons = {
  Sent: FiCheckCircle,
  Scheduled: FiClock,
  Failed: FiXCircle,
  Cancelled: FiXCircle,
};

export function Badge({ status }: { status: SmsStatus }) {
  const Icon = icons[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}
