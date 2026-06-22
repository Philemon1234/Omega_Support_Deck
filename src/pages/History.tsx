import { useOutletContext } from "react-router-dom";
import { FiMessageSquare } from "react-icons/fi";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { useAppContext } from "../context/AppContext";

type OutletContext = { search: string };

export function History() {
  const { search } = useOutletContext<OutletContext>();
  const { smsActivities } = useAppContext();
  const visibleActivities = smsActivities.filter((activity) =>
    `${activity.message} ${activity.status} ${activity.dateTime}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card className="overflow-hidden p-6">
      <h2 className="text-xl font-semibold text-slate-950">SMS History</h2>
      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Recipients</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date & Time</th>
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
            {!visibleActivities.length && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center font-semibold text-slate-500">
                  No SMS history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
