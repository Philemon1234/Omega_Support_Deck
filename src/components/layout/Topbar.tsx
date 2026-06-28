import { FiChevronDown, FiSearch } from "react-icons/fi";

type TopbarProps = {
  search: string;
  setSearch: (value: string) => void;
  placeholder: string;
};

export function Topbar({ search, setSearch, placeholder }: TopbarProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1">
        <FiSearch className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-[52px] pr-16 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-green-500 focus:ring-4 focus:ring-green-100"
        />
        <span className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 sm:block">
          Ctrl K
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white shadow-sm">
          A
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-950">Admin User</p>
          <p className="text-xs font-medium text-slate-500">Administrator</p>
        </div>
        <FiChevronDown className="hidden h-5 w-5 text-slate-600 sm:block" />
      </div>
    </header>
  );
}
