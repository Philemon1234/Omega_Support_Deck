import type { IconType } from "react-icons";
import { Card } from "./Card";

type StatCardProps = {
  icon: IconType;
  label: string;
  value: string | number;
  tone?: "green" | "red";
};

export function StatCard({ icon: Icon, label, value, tone = "green" }: StatCardProps) {
  const toneClass = tone === "red" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600";
  return (
    <Card className="flex min-h-32 items-center gap-5 p-6">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      </div>
    </Card>
  );
}
