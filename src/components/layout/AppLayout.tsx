import { Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const placeholders: Record<string, string> = {
  "/dashboard": "Search customers, messages...",
  "/customers": "Search by name or phone number...",
  "/sms": "Search by name or phone number...",
  "/templates": "Search templates...",
  "/history": "Search SMS history...",
};

export function AppLayout() {
  const location = useLocation();
  const [search, setSearch] = useState("");

  const placeholder = useMemo(() => placeholders[location.pathname] ?? "Search customers, messages...", [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="px-3 pb-8 pt-30 sm:px-6 lg:ml-[272px] lg:px-7 lg:pt-6">
        <Topbar search={search} setSearch={setSearch} placeholder={placeholder} />
        <div className="mt-6">
          <Outlet context={{ search }} />
        </div>
      </main>
    </div>
  );
}
