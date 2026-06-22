import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Customers } from "./pages/Customers";
import { Dashboard } from "./pages/Dashboard";
import { History } from "./pages/History";
import { SMS } from "./pages/SMS";
import { Templates } from "./pages/Templates";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/sms" element={<SMS />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/history" element={<History />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
