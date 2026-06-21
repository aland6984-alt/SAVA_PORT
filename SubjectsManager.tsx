"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/types";
import {
  DEFAULT_WEIGHTS,
  EXAM_PARTS,
  type ExamWeights,
  type Subject,
} from "@/lib/grades";
import { useI18n } from "@/components/I18nProvider";

const input =
  "w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-white placeholder-slate-300 outline-none focus:border-violet-400";

export default function SubjectsManager({ initial }: { initial: Subject[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [subjects, setSubjects] = useState<Subject[]>(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dept, setDept] = useState<string>(DEPARTMENTS[0]);
  const [year, setYear] = useState("1");
  const [weights, setWeights] = useState<ExamWeights>({ ...DEFAULT_WEIGHTS });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const total = EXAM_PARTS.reduce((s, p) => s + (Number(weights[p]) || 0), 0);

  async function add() {
    if (!name.trim()) return setErr(t("subjects.enterName"));
    if (total !== 100) return setErr(t("subjects.weightsError"));
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subjects")
      .insert({
        name: name.trim(),
        department: dept,
        year: Number(year),
        exam_weights: weights,
      })
      .select()
      .single();
    setBusy(false);
    if (error) return setErr(error.message);
    setSubjects((s) => [...s, data as Subject]);
    setName("");
    setWeights({ ...DEFAULT_WEIGHTS });
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm(t("subjects.deleteConfirm"))) return;
    const supabase = createClient();
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (!error) setSubjects((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mb-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
        >
          {t("subjects.new")}
        </button>
      ) : (
        <div className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <input
            className={input}
            placeholder={t("subjects.namePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr("");
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <select className={input} value={dept} onChange={(e) => setDept(e.target.value)}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} className="bg-slate-900">{d}</option>
              ))}
            </select>
            <select className={input} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="1" className="bg-slate-900">{t("signup.year1")}</option>
              <option value="2" className="bg-slate-900">{t("signup.year2")}</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">{t("subjects.weights")}</p>
            <div className="grid grid-cols-4 gap-2">
              {EXAM_PARTS.map((p) => (
                <label key={p} className="block">
                  <span className="mb-1 block text-[11px] text-slate-500">{t("exam." + p)}</span>
                  <input
                    type="number"
                    className={input}
                    value={weights[p]}
                    onChange={(e) =>
                      setWeights((w) => ({ ...w, [p]: Number(e.target.value) }))
                    }
                  />
                </label>
              ))}
            </div>
            <p className={`mt-1 text-xs ${total === 100 ? "text-emerald-300" : "text-amber-300"}`}>
              {t("subjects.total")}: {total} / 100
            </p>
          </div>
          {err && <p className="text-sm text-red-300">{err}</p>}
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={busy}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-60"
            >
              {busy ? t("common.saving") : t("subjects.add")}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
            >{t("common.cancel")}</button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="text-sm text-slate-500">{t("subjects.empty")}</p>
      ) : (
        <div className="space-y-2">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-slate-500">
                  {s.department} · {t("common.year")} {s.year}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/subjects/${s.id}`}
                  className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold hover:bg-violet-500"
                >{t("subjects.gradesBtn")}</Link>
                <button
                  onClick={() => remove(s.id)}
                  className="rounded-md border border-white/15 px-2 py-1.5 text-xs text-slate-400 hover:bg-white/10 hover:text-red-300"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
