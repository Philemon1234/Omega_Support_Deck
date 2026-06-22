import { useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCalendar,
  FiChevronRight,
  FiMessageSquare,
  FiSend,
  FiUpload,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { useAppContext } from "../context/AppContext";

type OutletContext = { search: string };

export function Dashboard() {
  const { search } = useOutletContext<OutletContext>();
  const { customers, dashboardStats, smsActivities, refreshDashboardStats, refreshSmsHistory } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    void Promise.all([refreshDashboardStats(), refreshSmsHistory()]);
  }, [refreshDashboardStats, refreshSmsHistory]);

  const recentActivities = smsActivities
    .filter((sms) => `${sms.message} ${sms.status}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);
  const growthData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toDateString();
    return {
      day: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
      value: customers.filter((customer) => new Date(customer.dateAdded).toDateString() === key).length,
    };
  });
  const maxGrowth = Math.max(1, ...growthData.map((item) => item.value));
  const scheduledMessages = smsActivities.filter((activity) => activity.status === "Scheduled").slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Customers" value={dashboardStats.totalCustomers.toLocaleString()} />
        <StatCard icon={FiMessageSquare} label="SMS Sent" value={dashboardStats.smsSent} />
        <StatCard icon={FiCalendar} label="Scheduled SMS" value={dashboardStats.scheduledSms} />
        <StatCard icon={FiAlertTriangle} label="Failed SMS" value={dashboardStats.failedSms} tone="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Customer Growth</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">New customers added over the last 7 days</p>
            </div>
            <Button variant="secondary" className="px-3 py-2">
              Last 7 days
            </Button>
          </div>
          <div className="mt-8 flex h-64 items-end gap-4 border-b border-slate-200 bg-[linear-gradient(to_top,#e2e8f0_1px,transparent_1px)] bg-[length:100%_20%] px-2 sm:gap-8">
            {growthData.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-sm font-bold text-slate-950">{item.value}</span>
                <div
                  className="w-full max-w-11 rounded-t-lg bg-gradient-to-t from-green-500 to-green-600"
                  style={{ height: `${Math.max(12, (item.value / maxGrowth) * 180)}px` }}
                />
                <span className="whitespace-nowrap text-xs font-medium text-slate-600">{item.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-center">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="h-3 w-3 rounded-sm bg-green-600" />
              New Customers
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Scheduled Messages</h2>
            <button className="text-sm font-bold text-green-600">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {scheduledMessages.map((message) => (
              <div key={message.id} className="flex items-center gap-4 py-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <FiCalendar className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-950">{message.message}</p>
                  <p className="text-sm font-medium text-slate-500">{message.dateTime}</p>
                </div>
                <FiChevronRight className="h-5 w-5 text-slate-500" />
              </div>
            ))}
            {!scheduledMessages.length && <p className="py-10 text-center text-sm font-semibold text-slate-500">No scheduled messages.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card className="overflow-hidden p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Recent SMS Activity</h2>
            <button className="text-sm font-bold text-green-600">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-3">Message</th>
                  <th className="py-3">Recipients</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td className="py-3 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-3">
                        <FiMessageSquare className="h-5 w-5 text-green-600" />
                        {activity.message}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{activity.recipients}</td>
                    <td className="py-3">
                      <Badge status={activity.status} />
                    </td>
                    <td className="py-3 text-slate-600">{activity.dateTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <button
              onClick={() => navigate("/customers")}
              className="flex w-full items-center gap-4 rounded-xl bg-green-600 p-4 text-left text-white shadow-sm transition hover:bg-green-700"
            >
              <FiUserPlus className="h-7 w-7" />
              <span className="flex-1">
                <span className="block font-bold">Add Customer</span>
                <span className="text-sm text-green-50">Add a new customer to your list</span>
              </span>
              <FiChevronRight />
            </button>
            {[
              { label: "Send SMS", text: "Create and send a new SMS", icon: FiSend, action: () => navigate("/sms") },
              { label: "Schedule SMS", text: "Schedule message for later", icon: FiCalendar, action: () => navigate("/sms") },
              { label: "Import Customers", text: "Upload customers from CSV", icon: FiUpload, action: () => navigate("/customers") },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:bg-green-50"
              >
                <item.icon className="h-6 w-6 text-green-600" />
                <span className="flex-1">
                  <span className="block font-bold text-slate-900">{item.label}</span>
                  <span className="text-sm font-medium text-slate-500">{item.text}</span>
                </span>
                <FiChevronRight className="text-slate-500" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
