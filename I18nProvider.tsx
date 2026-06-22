"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { isRTL, translate, type Locale } from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<Ctx | null>(null);

export default function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const setLocale = useCallback(
    (l: Locale) => {
      document.cookie = `lang=${l}; path=/; max-age=31536000`;
      document.documentElement.lang = l;
      document.documentElement.dir = isRTL(l) ? "rtl" : "ltr";
      router.refresh();
    },
    [router]
  );

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT(): (key: string) => string {
  return useI18n().t;
}
