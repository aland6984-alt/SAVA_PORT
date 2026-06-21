"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  EXAM_PARTS,
  computeFinal,
  isPass,
  letterGrade,
  normalizeWeights,
  statusColor,
  type ExamPart,
  type Grade,
  type Subject,
} from "@/lib/grades";
import type { Profile } from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";

type Cell = Record<ExamPart, string>;

function toNum(v: string): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export default function Gradebook({
  subject,
  students,
  grades,
}: {
  subject: Subject;
  students: Profile[];
  grades: Grade[];
}) {
  const { t } = useI18n();
  const weights = normalizeWeights(subject.exam_weights);

  const initial: Record<string, Cell> = {};
  for (const st of students) {
    const g = grades.find((x) => x.student_id === st.id);
    initial[st.id] = {
      quiz: g?.quiz != null ? String(g.quiz) : "",
      midterm: g?.midterm != null ? String(g.midterm) : "",
      final: g?.final != null ? String(g.final) : "",
      practical: g?.practical != null ? String(g.practical) : "",
    };
  }

  const [rows, setRows] = useState<Record<string, Cell>>(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  function setCell(sid: string, part: ExamPart, val: string) {
    setRows((r) => ({ ...r, [sid]: { ...r[sid], [part]: val } }));
  }

  async function save(st: Profile) {
    setSavingId(st.id);
    setMsg("");
    const r = rows[st.id];
    const payload = {
      subject_id: subject.id,
      student_id: st.id,
      quiz: toNum(r.quiz),
      midterm: toNum(r.midterm),
      final: toNum(r.final),
      practical: toNum(r.practical),
      updated_at: new Date().toISOString(),
    };
    const supabase = createClient();
    const { error } = await supabase
      .from("grades")
      .upsert(payload, { onConflict: "subject_id,student_id" });
    setSavingId(null);
    setMsg(error ? error.message : t("common.saved"));
  }

  return (
    <div>
      <a href="/dashboard/subjects" className="text-sm text-violet-300">
        {t("gradebook.back")}
      </a>
      <h1 className="mt-2 text-xl font-bold">{subject.name}</h1>
      <p className="text-sm text-slate-400">
        {subject.department} · {t("common.year")} {subject.year}
      </p>
      <p className="mb-5 mt-1 text-xs text-slate-500">
        {t("gradebook.weights")} — {EXAM_PARTS.map((p) => `${t("exam." + p)} ${weights[p]}%`).join(" · ")}
      </p>
      {msg && <p className="mb-3 text-sm text-slate-300">{msg}</p>}

      {students.length === 0 ? (
        <p className="text-sm text-slate-500">{t("gradebook.noStudents")}</p>
      ) : (
        <div className="space-y-2">
          {students.map((st) => {
            const r = rows[st.id];
            const final = computeFinal(
              {
                quiz: toNum(r.quiz),
                midterm: toNum(r.midterm),
                final: toNum(r.final),
                practical: toNum(r.practical),
              },
              weights
            );
            return (
              <div key={st.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-medium">{st.full_name ?? "—"}</div>
                  {final !== null ? (
                    <span className={`text-xs font-bold ${statusColor(final)}`}>
                      {final}% · {letterGrade(final)} · {isPass(final) ? t("grades.pass") : t("grades.fail")}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {EXAM_PARTS.map((p) => (
                    <label key={p} className="block">
                      <span className="mb-0.5 block text-[10px] text-slate-500">
                        {t("exam." + p)}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={r[p]}
                        onChange={(e) => setCell(st.id, p, e.target.value)}
                        className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm outline-none focus:border-violet-400"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-2 text-right">
                  <button
                    onClick={() => save(st)}
                    disabled={savingId === st.id}
                    className="rounded-md bg-violet-600 px-3 py-1 text-xs font-semibold hover:bg-violet-500 disabled:opacity-60"
                  >
                    {savingId === st.id ? "…" : t("common.save")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
