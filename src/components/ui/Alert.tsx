import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

type AlertProps = {
  message: string;
  type?: "error" | "success";
};

export function Alert({ message, type = "error" }: AlertProps) {
  const success = type === "success";
  const Icon = success ? FiCheckCircle : FiAlertTriangle;
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-5 text-sm font-semibold ${
        success ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          success ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span>{message}</span>
    </div>
  );
}
