import { useEffect, useMemo, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import { FiBell, FiCalendar, FiMessageSquare, FiSend, FiUsers, FiX } from "react-icons/fi";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { useAppContext } from "../context/AppContext";

type OutletContext = { search: string };
type RecipientMode = "all" | "selected" | "phone";

export function SMS() {
  const { search } = useOutletContext<OutletContext>();
  const location = useLocation();
  const {
    customers,
    smsActivities,
    smsTemplates,
    selectedCustomerIds,
    setSelectedCustomerIds,
    dashboardStats,
    refreshCustomers,
    refreshSmsHistory,
    sendSmsNow,
    sendTestSms,
    scheduleSms,
    apiError,
  } = useAppContext();
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [customerQuery, setCustomerQuery] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const totalCustomers = dashboardStats.totalCustomers || customers.length;
  const selectedCustomers = customers.filter((customer) => selectedCustomerIds.includes(customer.id));
  const recipients = recipientMode === "all" ? totalCustomers : recipientMode === "selected" ? selectedCustomerIds.length : 1;
  const segments = Math.max(1, Math.ceil(message.length / 160));

  const matchingCustomers = useMemo(() => {
    const query = customerQuery.toLowerCase().trim();
    if (!query) return customers;
    return customers
      .filter((customer) => customer.name.toLowerCase().includes(query) || customer.phone.toLowerCase().includes(query))
      .slice(0, 100);
  }, [customers, customerQuery]);

  const visibleActivities = smsActivities
    .filter((sms) => `${sms.message} ${sms.status}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    void Promise.all([refreshCustomers(), refreshSmsHistory()]);
  }, [refreshCustomers, refreshSmsHistory]);

  useEffect(() => {
    const state = location.state as { templateMessage?: string } | null;
    if (state?.templateMessage) {
      setMessage(state.templateMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const validateSend = () => {
    if (!message.trim()) {
      setNotice({ type: "error", message: "SMS message is required." });
      return false;
    }
    if (recipientMode === "selected" && selectedCustomerIds.length === 0) {
      setNotice({ type: "error", message: "Please select at least one customer." });
      return false;
    }
    if (recipientMode === "phone" && !phoneNumber.trim()) {
      setNotice({ type: "error", message: "Please enter a phone number." });
      return false;
    }
    return true;
  };

  const handleSend = async () => {
    if (!validateSend()) return;
    if (
      recipientMode === "all" &&
      !window.confirm(`You are about to send this SMS to ${totalCustomers.toLocaleString()} customers. Are you sure you want to continue?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    const result =
      recipientMode === "phone"
        ? await sendTestSms(phoneNumber, message)
        : await sendSmsNow(message, recipientMode === "selected" ? "selected" : "all", undefined, selectedCustomerIds);
    setIsSubmitting(false);
    if (!result.ok) {
      setNotice({ type: "error", message: result.error });
      return;
    }
    setNotice({ type: "success", message: result.message });
    setMessage("");
  };

  const handleSchedule = async () => {
    if (!validateSend()) return;
    if (!date || !time) {
      setNotice({ type: "error", message: "Please select schedule date and time." });
      return;
    }
    if (recipientMode === "phone") {
      setNotice({ type: "error", message: "Scheduling is available for saved customers only. Add the phone number as a customer first." });
      return;
    }

    setIsSubmitting(true);
    const result = await scheduleSms(
      message,
      recipientMode === "selected" ? "selected" : "all",
      new Date(`${date}T${time}`).toISOString(),
      undefined,
      selectedCustomerIds,
    );
    setIsSubmitting(false);
    if (!result.ok) {
      setNotice({ type: "error", message: result.error });
      return;
    }
    setNotice({ type: "success", message: result.message });
    setMessage("");
    setDate("");
    setTime("");
  };

  const toggleSelectedCustomer = (customerId: number) => {
    setSelectedCustomerIds((current) =>
      current.includes(customerId) ? current.filter((id) => id !== customerId) : [...current, customerId],
    );
  };

  const applyTemplate = (templateMessage: string) => {
    setMessage(templateMessage);
    setShowTemplates(false);
  };

  const sendDisabled = isSubmitting || (recipientMode === "selected" && selectedCustomerIds.length === 0);

  return (
    <div className="space-y-6">
      {apiError && <Alert message={apiError} />}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.9fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-950">Create SMS</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Send a message to all registered customers.</p>

          <div className="mt-6 grid rounded-xl border border-slate-200 bg-slate-50 p-1 sm:grid-cols-3">
            {[
              { value: "all", label: "All Customers" },
              { value: "selected", label: "Selected Customers" },
              { value: "phone", label: "Phone Number" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setRecipientMode(option.value as RecipientMode)}
                className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                  recipientMode === option.value ? "bg-white text-green-700 shadow-sm" : "text-slate-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 px-4 py-3">
            {recipientMode === "all" ? (
              <p className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
                <FiUsers className="h-5 w-5 text-green-600" />
                Recipients: All Customers ({totalCustomers.toLocaleString()})
              </p>
            ) : recipientMode === "selected" ? (
              <div className="space-y-3">
                <Input
                  value={customerQuery}
                  onChange={(event) => {
                    setCustomerQuery(event.target.value);
                  }}
                  placeholder="Search customer by name or phone number..."
                />
                <p className="text-sm font-medium text-slate-700">
                  {selectedCustomerIds.length ? `${selectedCustomerIds.length} customers selected` : "Recipients: No customers selected"}
                </p>
                {selectedCustomers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomers.slice(0, 8).map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => toggleSelectedCustomer(customer.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 hover:bg-green-100"
                      >
                        {customer.name}
                        <FiX />
                      </button>
                    ))}
                    {selectedCustomers.length > 8 && <span className="text-xs font-bold text-slate-500">+{selectedCustomers.length - 8} more</span>}
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
                  {matchingCustomers.map((customer) => (
                    <label key={customer.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-0 hover:bg-green-50">
                      <input
                        type="checkbox"
                        checked={selectedCustomerIds.includes(customer.id)}
                        onChange={() => toggleSelectedCustomer(customer.id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-800">{customer.name}</span>
                        <span className="text-xs font-semibold text-slate-500">{customer.phone}</span>
                      </span>
                    </label>
                  ))}
                  {!matchingCustomers.length && <p className="px-3 py-4 text-sm font-semibold text-slate-500">No matching customers.</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="Enter phone number, e.g. 0701234567"
                />
                <p className="text-xs font-semibold text-slate-500">The backend will normalize and validate this Ugandan phone number before sending.</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-900">Message</span>
            <div className="relative">
              <Button variant="secondary" className="px-3 py-2" onClick={() => setShowTemplates((current) => !current)}>
                Choose Template
              </Button>
              {showTemplates && (
                <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {smsTemplates.slice(0, 6).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template.message)}
                      className="block w-full cursor-pointer border-b border-slate-100 px-4 py-3 text-left hover:bg-green-50 last:border-0"
                    >
                      <span className="block text-sm font-medium text-slate-900">{template.title}</span>
                      <span className="line-clamp-1 text-xs font-semibold text-slate-500">{template.message}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <label className="mt-2 block">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your SMS message here..."
              rows={6}
            />
          </label>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
            <span className={message.length > 160 ? "text-amber-600" : "text-slate-500"}>
              {message.length > 160 ? "Message is longer than one SMS segment." : "Standard SMS supports up to 160 characters."}
            </span>
            <span className="text-slate-600">{message.length} / 160 characters</span>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-slate-900">Schedule for later (optional)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Button onClick={handleSend} className="py-4" disabled={sendDisabled}>
              <FiSend className="h-5 w-5" />
              {isSubmitting ? "Sending..." : "Send SMS Now"}
            </Button>
            <Button onClick={handleSchedule} variant="secondary" className="py-4" disabled={sendDisabled || recipientMode === "phone"}>
              <FiCalendar className="h-5 w-5" />
              {isSubmitting ? "Please wait..." : "Schedule SMS"}
            </Button>
          </div>
          {notice && (
            <div className="mt-5">
              <Alert message={notice.message} type={notice.type} />
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-950">Message Preview</h2>
            <div className="mt-5 rounded-xl border border-green-100 bg-green-50/40 p-5">
              <p className="mb-3 text-center text-sm font-semibold text-slate-600">Preview</p>
              <div className="mx-auto h-[285px] max-w-[220px] rounded-[2.2rem] border-[10px] border-slate-950 bg-white p-4 shadow-xl sm:h-[285px]">
                <div className="mx-auto -mt-3 mb-5 h-5 w-20 rounded-b-xl bg-slate-950" />
                <p className="text-center text-xs font-semibold text-slate-500">10:30 AM</p>
                <div className="mt-5 max-h-44 overflow-y-auto">
                  {message.trim() ? (
                    <div className="max-w-full whitespace-pre-wrap break-words rounded-2xl bg-slate-100 p-4 text-sm leading-5 text-slate-950 [overflow-wrap:anywhere]">
                      {message}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-medium leading-5 text-slate-400">
                      Your message preview will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-950">SMS Summary</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              {[
                { icon: FiUsers, label: "Recipients", value: recipientMode === "all" ? `${totalCustomers.toLocaleString()} customers` : `${recipients} customer${recipients === 1 ? "" : "s"}` },
                { icon: FiMessageSquare, label: "Estimated Segments", value: `${segments} message${segments > 1 ? "s" : ""}` },
                { icon: FiBell, label: "Delivery Type", value: "Notification" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-600">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">Recent SMS Activity</h2>
          <button className="text-sm font-medium text-green-600">View all</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-bold">Message</th>
                <th className="px-4 py-3 font-bold">Recipients</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleActivities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-3">
                      <FiMessageSquare className="h-5 w-5 text-green-600" />
                      {activity.message}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{activity.recipients}</td>
                  <td className="px-4 py-3">
                    <Badge status={activity.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{activity.dateTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
