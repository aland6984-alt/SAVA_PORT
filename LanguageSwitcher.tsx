"use client";

import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-sm outline-none focus:border-violet-400"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l} className="bg-slate-900">
          {LOCALE_NAMES[l]}
        </option>
      ))}
    </select>
  );
}
