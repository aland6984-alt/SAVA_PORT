"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/types";
import { DAYS, type TimetableEntry } from "@/lib/timetable";
import { useT } from "@/components/I18nProvider";

const input =
  "w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-violet-400";

export default function TimetableManager({ initial }: { initial: TimetableEntry[] }) {
  const router = useRouter();
  const t = useT();

  const [entries, setEntries] = useState<TimetableEntry[]>(initial);
  const [dept, setDept] = useState<string>(DEPARTMENTS[0]);
  const [year, setYear] = useState("1");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // add form
  const [day, setDay] = useState(1); // default Sunday
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");

  const classEntries = entries.filter(
    (e) => e.department === dept && e.year === Number(year)
  );
  const daysWithClasses = DAYS.filter((d) =>
    classEntries.some((e) => e.day_of_week === d.n)
  );

  async function add() {
    if (!subject.trim()) {
      setErr(t("tt.fillRequired"));
      return;
    }
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("timetable")
      .insert({
        department: dept,
        year: Number(year),
        day_of_week: day,
        start_time: start,
        end_time: end,
        subject: subject.trim(),
        teacher: teacher.trim() || null,
        room: room.trim() || null,
      })
      .select()
      .single();
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setEntries((s) => [...s, data as TimetableEntry]);
    setSubject("");
    setTeacher("");
    setRoom("");
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("timetable").delete().eq("id", id);
    if (!error) setEntries((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div>
      {/* class picker */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <select className={input} value={dept} onChange={(e) => setDept(e.target.value)}>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d} className="bg-slate-900">
              {d}
            </option>
          ))}
        </select>
        <select className={input} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="1" className="bg-slate-900">{t("signup.year1")}</option>
          <option value="2" className="bg-slate-900">{t("signup.year2")}</option>
        </select>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mb-5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
        >
          {t("tt.add")}
        </button>
      ) : (
        <div className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">{t("tt.day")}</span>
              <select
                className={input}
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
              >
                {DAYS.map((d) => (
                  <option key={d.n} value={d.n} className="bg-slate-900">
                    {t(d.key)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">{t("tt.subject")}</span>
              <input
                className={input}
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setErr("");
                }}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">{t("tt.start")}</span>
              <input
                type="time"
                className={input}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">{t("tt.end")}</span>
              <input
                type="time"
                className={input}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">{t("role.teacher")}</span>
              <input
                className={input}
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">{t("tt.room")}</span>
              <input className={input} value={room} onChange={(e) => setRoom(e.target.value)} />
            </label>
          </div>
          {err && <p className="text-sm text-red-300">{err}</p>}
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={busy}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-60"
            >
              {busy ? t("common.saving") : t("tt.addBtn")}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* schedule for selected class */}
      {classEntries.length === 0 ? (
        <p className="text-sm text-slate-500">{t("tt.empty")}</p>
      ) : (
        <div className="space-y-5">
          {daysWithClasses.map((d) => {
            const dayEntries = classEntries
              .filter((e) => e.day_of_week === d.n)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            return (
              <div key={d.n}>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-violet-300">
                  {t(d.key)}
                </h2>
                <div className="space-y-2">
                  {dayEntries.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="w-16 shrink-0 text-center">
                        <div className="text-sm font-bold">{e.start_time}</div>
                        <div className="text-[10px] text-slate-500">{e.end_time}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{e.subject}</div>
                        {(e.teacher || e.room) && (
                          <div className="text-xs text-slate-400">
                            {[e.teacher, e.room].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => remove(e.id)}
                        title={t("common.delete")}
                        className="rounded-md border border-white/15 px-2 py-1.5 text-xs text-slate-400 hover:bg-white/10 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
