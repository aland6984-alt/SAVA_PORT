"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/I18nProvider";

export default function SignOutButton() {
  const router = useRouter();
  const t = useT();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
    >
      {t("common.signOut")}
    </button>
  );
}
