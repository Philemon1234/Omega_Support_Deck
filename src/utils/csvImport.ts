import { normalizeUgandanPhoneNumber } from "./phone";

export type ImportedCustomerRow = {
  name: string;
  phone: string;
};

const nameColumns = ["name", "customername", "fullname"];
const phoneColumns = ["payer", "phone", "phonenumber", "number", "mobile"];

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getValueByAliases(row: Record<string, unknown>, aliases: string[]) {
  const matchedKey = Object.keys(row).find((key) => aliases.includes(normalizeHeader(key)));
  const value = matchedKey ? row[matchedKey] : "";
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

export function mapCsvRowToCustomer(row: Record<string, unknown>): ImportedCustomerRow | null {
  const name = getValueByAliases(row, nameColumns);
  const rawPhone = getValueByAliases(row, phoneColumns);
  const phone = normalizeUgandanPhoneNumber(rawPhone);

  if (!name || !phone) {
    return null;
  }

  return { name, phone };
}
