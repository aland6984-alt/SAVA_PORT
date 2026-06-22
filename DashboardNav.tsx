"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAdmin, isStaff, roleHome, type Role } from "@/lib/types";
import { useT } from "@/components/I18nProvider";

export default function DashboardNav({ role }: { role: Role }) {
  const path = usePathname();
  const t = useT();
  const links = [
    { href: roleHome[role], label: t("nav.home") },
    { href: "/dashboard/announcements", label: t("nav.announcements") },
    ...(role === "student" ? [{ href: "/dashboard/grades", label: t("nav.grades") }] : []),
    ...(isStaff(role) ? [{ href: "/dashboard/subjects", label: t("nav.subjects") }] : []),
    ...(isAdmin(role) ? [{ href: "/dashboard/people", label: t("nav.people") }] : []),
    { href: "/dashboard/profile", label: t("nav.profile") },
  ];
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {links.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-violet-600/30 text-violet-200" : "text-slate-300 hover:bg-white/5"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
