"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS, type Profile, type Role } from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";

const ROLES: Role[] = ["student", "teacher", "admin", "super_admin"];
const input =
  "rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm outline-none focus:border-violet-400";

export default function PeopleManager({ initial }: { initial: Profile[] }) {
  const { t } = useI18n();
  const [people, setPeople] = useState<Profile[]>(initial);
  const [q, setQ] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const filtered = people.filter((p) => {
    const needle = q.toLowerCase();
    return (
      (p.full_name ?? "").toLowerCase().includes(needle) ||
      (p.email ?? "").toLowerCase().includes(needle)
    );
  });

  function patch(id: string, key: keyof Profile, value: unknown) {
    setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  }

  async function save(p: Profile) {
    setSavingId(p.id);
    setMsg("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        role: p.role,
        department: p.department || null,
        year: p.year ? Number(p.year) : null,
      })
      .eq("id", p.id);
    setSavingId(null);
    setMsg(error ? error.message : t("common.saved"));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          placeholder={t("people.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${input} w-64`}
        />
        <span className="text-xs text-slate-500">{filtered.length} {t("people.peopleCount")}</span>
        {msg && <span className="text-xs text-slate-300">{msg}</span>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">{t("people.name")}</th>
              <th className="px-3 py-2">{t("profile.role")}</th>
              <th className="px-3 py-2">{t("profile.department")}</th>
              <th className="px-3 py-2">{t("common.year")}</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="px-3 py-2">
                  <div className="font-medium">{p.full_name ?? "—"}</div>
                  <div className="text-xs text-slate-500">{p.email ?? ""}</div>
                </td>
                <td className="px-3 py-2">
                  <select
                    className={input}
                    value={p.role}
                    onChange={(e) => patch(p.id, "role", e.target.value as Role)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-slate-900">{t("role." + r)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    className={input}
                    value={p.department ?? ""}
                    onChange={(e) => patch(p.id, "department", e.target.value)}
                  >
                    <option value="" className="bg-slate-900">—</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    className={input}
                    value={p.year ?? ""}
                    onChange={(e) =>
                      patch(p.id, "year", e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="" className="bg-slate-900">—</option>
                    <option value="1" className="bg-slate-900">1</option>
                    <option value="2" className="bg-slate-900">2</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => save(p)}
                    disabled={savingId === p.id}
                    className="rounded-md bg-violet-600 px-3 py-1 text-xs font-semibold hover:bg-violet-500 disabled:opacity-60"
                  >
                    {savingId === p.id ? "…" : t("common.save")}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">{t("people.noResults")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
