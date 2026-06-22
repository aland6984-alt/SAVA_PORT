import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, translate, type Locale } from "@/lib/i18n";

// Reads the chosen language from the cookie (server side).
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get("lang")?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

// Returns a translate function bound to the current locale, for Server Components.
export async function getT() {
  const locale = await getLocale();
  return (key: string) => translate(locale, key);
}
