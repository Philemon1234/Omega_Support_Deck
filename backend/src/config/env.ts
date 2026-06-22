import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.resolve(__dirname, "../../.env");
const rootEnvPath = path.resolve(__dirname, "../../../.env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath, override: true });

function normalizeUgSmsSenderId(value?: string) {
  const senderId = (value ?? "OMEGAWIFI").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 11);
  return senderId || "OMEGAWIFI";
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  smsProvider: process.env.SMS_PROVIDER ?? "ug_sms",
  smsMock: String(process.env.SMS_MOCK ?? "true").toLowerCase() === "true",
  ugSmsApiKey: process.env.UGSMS_API_KEY,
  ugSmsApiUrl: process.env.UGSMS_API_URL ?? process.env.UGSMS_BASE_URL ?? "https://ugsms.com/api/v2/sms/send",
  ugSmsSenderId: normalizeUgSmsSenderId(process.env.UGSMS_SENDER_ID),
  ugSmsTimeoutMs: Number(process.env.UGSMS_TIMEOUT_MS ?? 15000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
};

export function validateSmsEnvForRealSending() {
  if (env.smsMock) return null;
  if (!env.ugSmsApiKey) return "UGSMS_API_KEY is required when SMS_MOCK=false.";
  return null;
}
