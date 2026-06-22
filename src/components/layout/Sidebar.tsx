import { NavLink } from "react-router-dom";
import { FiClock, FiFileText, FiGrid, FiMessageSquare, FiRadio, FiUsers } from "react-icons/fi";

const links = [
  { label: "Dashboard", icon: FiGrid, to: "/dashboard" },
  { label: "Customers", icon: FiUsers, to: "/customers" },
  { label: "SMS", icon: FiMessageSquare, to: "/sms" },
  { label: "Templates", icon: FiFileText, to: "/templates" },
  { label: "History", icon: FiClock, to: "/history" },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur lg:inset-y-0 lg:left-0 lg:w-[272px] lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
      <div className="flex items-center gap-3 lg:block">
        <NavLink to="/dashboard" className="flex cursor-pointer items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-600">
            <FiRadio className="h-7 w-7" />
          </span>
          <span className="text-lg font-semibold leading-tight tracking-tight text-slate-950 sm:text-xl">
            Omega
            <span className="block text-sm font-semibold text-green-600 sm:text-base">Support Deck</span>
          </span>
        </NavLink>

        <nav className="ml-auto flex min-w-0 gap-2 overflow-x-auto lg:ml-0 lg:mt-12 lg:block lg:space-y-3">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `flex min-w-max cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:min-w-0 lg:gap-3 lg:px-4 lg:py-3 ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
