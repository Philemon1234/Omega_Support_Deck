export function normalizeUgandanPhoneNumber(input: string): string | null {
  const cleaned = input.replace(/[\s\-()]/g, "");

  if (/^\+2567\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^2567\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^07\d{8}$/.test(cleaned)) {
    return `+256${cleaned.slice(1)}`;
  }

  if (/^7\d{8}$/.test(cleaned)) {
    return `+256${cleaned}`;
  }

  return null;
}
