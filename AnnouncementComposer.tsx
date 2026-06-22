"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";

const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-400";

export default function AnnouncementComposer({
  lockedDept,
}: {
  lockedDept: string | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dept, setDept] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function post() {
    if (!title.trim()) {
      setErr(t("ann.enterTitle"));
      return;
    }
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("announcements").insert({
      title: title.trim(),
      body: body.trim(),
      audience_dept: lockedDept ? lockedDept : dept || null,
      audience_year: year ? Number(year) : null,
      created_by: user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setTitle("");
    setBody("");
    setDept("");
    setYear("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
      >
        {t("ann.new")}
      </button>
    );
  }

  return (
    <div className="mb-5 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
      <input
        placeholder={t("ann.titlePlaceholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={input}
      />
      <textarea
        placeholder={t("ann.bodyPlaceholder")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className={input}
      />
      <div className="grid grid-cols-2 gap-2">
        {lockedDept ? (
          <div className={input + " flex items-center text-slate-300"}>
            {t("ann.postingTo")}:&nbsp;<span className="font-semibold text-white">{lockedDept}</span>
          </div>
        ) : (
          <select value={dept} onChange={(e) => setDept(e.target.value)} className={input}>
            <option value="" className="bg-slate-900">{t("ann.wholeInstitute")}</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} className="bg-slate-900">{d}</option>
            ))}
          </select>
        )}
        <select value={year} onChange={(e) => setYear(e.target.value)} className={input}>
          <option value="" className="bg-slate-900">{t("ann.allYears")}</option>
          <option value="1" className="bg-slate-900">{t("signup.year1")}</option>
          <option value="2" className="bg-slate-900">{t("signup.year2")}</option>
        </select>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <div className="flex gap-2">
        <button
          onClick={post}
          disabled={busy}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-60"
        >
          {busy ? t("ann.posting") : t("ann.post")}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
        >{t("common.cancel")}</button>
      </div>
    </div>
  );
}
