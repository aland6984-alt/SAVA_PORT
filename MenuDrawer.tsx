"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdmin, isStaff, roleHome, type Role } from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";
import { createClient } from "@/lib/supabase/client";
import { LOCALES, type Locale } from "@/lib/i18n";

export default function MenuDrawer({ role, name }: { role: Role; name: string | null }) {
  const path = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const links = [
    { href: roleHome[role], label: t("nav.home"), icon: "🏠" },
    { href: "/dashboard/announcements", label: t("nav.announcements"), icon: "📢" },
    { href: "/dashboard/timetable", label: t("nav.timetable"), icon: "🗓️" },
    { href: "/dashboard/materials", label: t("nav.materials"), icon: "📄" },
    { href: "/dashboard/attendance", label: t("nav.attendance"), icon: "📷" },
    { href: "/dashboard/chat", label: t("nav.chat"), icon: "💬" },
    ...(role === "student" ? [{ href: "/dashboard/grades", label: t("nav.grades"), icon: "💯" }] : []),
    ...(isStaff(role) ? [{ href: "/dashboard/subjects", label: t("nav.subjects"), icon: "📚" }] : []),
    ...(isAdmin(role) ? [{ href: "/dashboard/people", label: t("nav.people"), icon: "👥" }] : []),
    { href: "/dashboard/profile", label: t("nav.profile"), icon: "🪪" },
  ];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-slate-200 hover:bg-white/10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="sava-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="sava-drawer absolute inset-y-0 start-0 flex w-72 max-w-[82%] flex-col border-e border-white/10 bg-slate-950/95 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sava-logo.jpg" alt="SAVA" className="h-9 w-9 rounded-lg ring-1 ring-white/15" />
                <div className="leading-tight">
                  <div className="text-sm font-bold">SAVA</div>
                  <div className="text-[11px] text-slate-400">{t("app.name")}</div>
                </div>
              </div>
              <button aria-label="Close" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-sm font-medium">{name ?? "—"}</div>
              <div className="text-xs text-violet-300">{t("role." + role)}</div>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {links.map((l) => {
                const active = path === l.href || path.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-violet-600/30 text-violet-100" : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-base">{l.icon}</span>
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="mb-2 flex items-center gap-1">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l as Locale)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      locale === l ? "bg-violet-600/30 text-violet-100" : "border border-white/10 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={signOut} className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10">
                {t("common.signOut")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
