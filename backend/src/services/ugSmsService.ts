import { env, validateSmsEnvForRealSending } from "../config/env.js";
import { normalizeManyUgandanPhoneNumbers } from "../utils/phone.js";

type SendSmsParams = {
  numbers: string[];
  message: string;
  messageType?: "notification" | "transactional" | "otp";
};

export async function sendSmsViaUgSms(params: SendSmsParams): Promise<{
  success: boolean;
  mocked?: boolean;
  provider: "UGSMS";
  recipientsCount: number;
  validNumbers: string[];
  invalidNumbers: string[];
  httpStatus?: number;
  rawResponse?: string;
  errorMessage?: string;
}> {
  const message = params.message.trim();
  const { validNumbers, invalidNumbers } = normalizeManyUgandanPhoneNumbers(params.numbers);

  if (!message) {
    return { success: false, provider: "UGSMS", recipientsCount: 0, validNumbers, invalidNumbers, errorMessage: "Message is required." };
  }

  if (!validNumbers.length) {
    return { success: false, provider: "UGSMS", recipientsCount: 0, validNumbers, invalidNumbers, errorMessage: "No valid recipient phone numbers were provided." };
  }

  if (env.smsMock) {
    return {
      success: true,
      mocked: true,
      provider: "UGSMS",
      recipientsCount: validNumbers.length,
      validNumbers,
      invalidNumbers,
      rawResponse: JSON.stringify({ success: true, mocked: true }),
    };
  }

  const envError = validateSmsEnvForRealSending();
  if (envError) {
    return { success: false, provider: "UGSMS", recipientsCount: validNumbers.length, validNumbers, invalidNumbers, errorMessage: envError };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ugSmsTimeoutMs);

  try {
    const response = await fetch(env.ugSmsApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.ugSmsApiKey!,
      },
      body: JSON.stringify({
        numbers: validNumbers.join(","),
        message_body: message,
        // UG SMS must approve this sender ID before it appears on customers' phones.
        sender_id: process.env.UGSMS_SENDER_ID || "OMEGAWIFI",
        message_type: params.messageType ?? "notification",
      }),
      signal: controller.signal,
    });

    const rawResponse = await response.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      parsed = null;
    }

    const providerSuccess =
      response.ok &&
      typeof parsed === "object" &&
      parsed !== null &&
      (((parsed as { success?: unknown }).success === true) || (parsed as { status?: unknown }).status === "success");

    return {
      success: providerSuccess,
      provider: "UGSMS",
      recipientsCount: validNumbers.length,
      validNumbers,
      invalidNumbers,
      httpStatus: response.status,
      rawResponse,
      errorMessage: providerSuccess ? undefined : rawResponse || "UGSMS returned an unsuccessful response.",
    };
  } catch (error) {
    const errorMessage = error instanceof Error && error.name === "AbortError" ? "UGSMS request timed out." : error instanceof Error ? error.message : "UGSMS request failed.";
    return { success: false, provider: "UGSMS", recipientsCount: validNumbers.length, validNumbers, invalidNumbers, errorMessage };
  } finally {
    clearTimeout(timeout);
  }
}
