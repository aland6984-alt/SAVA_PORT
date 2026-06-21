"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BLOOD_TYPES,
  DEPARTMENTS,
  isAdmin,
  type PhonePrivacy,
  type Profile,
} from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";

const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 outline-none focus:border-violet-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { t } = useI18n();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [department, setDepartment] = useState(profile.department ?? "");
  const [year, setYear] = useState(profile.year ? String(profile.year) : "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [blood, setBlood] = useState(profile.blood ?? "");
  const [privacy, setPrivacy] = useState<PhonePrivacy>(
    (profile.phone_privacy as PhonePrivacy) ?? "staff"
  );
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const locked = !isAdmin(profile.role); // students/teachers can't change their own class/role
  const isStudent = profile.role === "student";

  async function save() {
    setSaving(true);
    setMsg("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        phone: phone || null,
        blood: blood || null,
        phone_privacy: privacy,
        department: department || null,
        year: year ? Number(year) : null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg(t("common.saved"));
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
      <Field label={t("signup.fullName")}>
        <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("profile.role")}>
          <input className={`${input} opacity-60`} value={t("role." + profile.role)} disabled />
        </Field>
        <Field label={t("login.email")}>
          <input className={`${input} opacity-60`} value={profile.email ?? ""} disabled />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("profile.department")}>
          <select
            className={`${input} ${locked ? "opacity-60" : ""}`}
            value={department}
            disabled={locked}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="" className="bg-slate-900">—</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} className="bg-slate-900">{d}</option>
            ))}
          </select>
        </Field>
        {isStudent && (
          <Field label={t("common.year")}>
            <select
              className={`${input} ${locked ? "opacity-60" : ""}`}
              value={year}
              disabled={locked}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="" className="bg-slate-900">—</option>
              <option value="1" className="bg-slate-900">{t("signup.year1")}</option>
              <option value="2" className="bg-slate-900">{t("signup.year2")}</option>
            </select>
          </Field>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("profile.phone")}>
          <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label={t("profile.blood")}>
          <select className={input} value={blood} onChange={(e) => setBlood(e.target.value)}>
            <option value="" className="bg-slate-900">—</option>
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b} className="bg-slate-900">{b}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t("profile.phonePrivacy")}>
        <select
          className={input}
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as PhonePrivacy)}
        >
          <option value="all" className="bg-slate-900">{t("privacy.all")}</option>
          <option value="staff" className="bg-slate-900">{t("privacy.staff")}</option>
          <option value="friends" className="bg-slate-900">{t("privacy.friends")}</option>
          <option value="private" className="bg-slate-900">{t("privacy.private")}</option>
        </select>
      </Field>

      {locked && (
        <p className="text-xs text-slate-500">{t("profile.lockedNote")}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-60"
        >
          {saving ? t("common.saving") : t("common.saveChanges")}
        </button>
        {msg && <span className="text-sm text-slate-300">{msg}</span>}
      </div>
    </div>
  );
}
