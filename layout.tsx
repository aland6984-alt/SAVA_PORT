import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import SignOutButton from "@/components/SignOutButton";
import MenuDrawer from "@/components/MenuDrawer";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  const t = await getT();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2">
            <MenuDrawer role={profile.role} name={profile.full_name} />
            <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold tracking-wide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sava-logo.jpg" alt="SAVA" className="h-8 w-8 rounded-lg ring-1 ring-white/15" />
            SAVA
            </Link>
          </div>
          <div className="hidden items-center gap-2 text-sm sm:flex">
            <span className="text-slate-400">
              {profile.full_name ?? "—"} ·{" "}
              <span className="text-violet-300">{t("role." + profile.role)}</span>
            </span>
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-5">{children}</main>
    </div>
  );
}
