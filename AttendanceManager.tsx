"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/types";
import {
  randomToken,
  type AttendanceSession,
  type Checkin,
} from "@/lib/attendance";
import { useT } from "@/components/I18nProvider";

const input =
  "w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-violet-400";

export default function AttendanceManager({
  initialSessions,
  lockedDept,
}: {
  initialSessions: AttendanceSession[];
  lockedDept: string | null;
}) {
  const t = useT();

  const [sessions, setSessions] = useState<AttendanceSession[]>(initialSessions);
  const [dept, setDept] = useState<string>(lockedDept ?? DEPARTMENTS[0]);
  const [year, setYear] = useState("1");
  const [subject, setSubject] = useState("");
  const [active, setActive] = useState<AttendanceSession | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const classSessions = sessions.filter(
    (s) => s.department === dept && s.year === Number(year)
  );

  const fetchCheckins = useCallback(async (sessionId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("attendance_checkins")
      .select("*, student:student_id(full_name)")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    setCheckins((data as Checkin[]) ?? []);
  }, []);

  // Build the QR whenever the active session changes.
  useEffect(() => {
    if (!active) {
      setQr("");
      return;
    }
    const url = `${window.location.origin}/checkin/${active.token}`;
    QRCode.toDataURL(url, { width: 240, margin: 2 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [active]);

  // Poll check-ins while an open session is active.
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (active) {
      fetchCheckins(active.id);
      if (active.status === "open") {
        pollRef.current = setInterval(() => fetchCheckins(active.id), 4000);
      }
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [active, fetchCheckins]);

  async function startSession() {
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("attendance_sessions")
      .insert({
        token: randomToken(),
        department: dept,
        year: Number(year),
        subject: subject.trim() || null,
        status: "open",
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    const s = data as AttendanceSession;
    setSessions((prev) => [s, ...prev]);
    setActive(s);
    setCheckins([]);
    setSubject("");
  }

  async function closeSession() {
    if (!active) return;
    const supabase = createClient();
    await supabase
      .from("attendance_sessions")
      .update({ status: "closed" })
      .eq("id", active.id);
    const closed = { ...active, status: "closed" };
    setActive(closed);
    setSessions((prev) => prev.map((s) => (s.id === closed.id ? closed : s)));
  }

  const url = active ? `${window.location.origin}/checkin/${active.token}` : "";

  return (
    <div>
      {/* class picker + start */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        {lockedDept ? (
          <div className={input + " flex items-center font-medium"}>{lockedDept}</div>
        ) : (
          <select className={input} value={dept} onChange={(e) => setDept(e.target.value)}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} className="bg-slate-900">
                {d}
              </option>
            ))}
          </select>
        )}
        <select className={input} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="1" className="bg-slate-900">{t("signup.year1")}</option>
          <option value="2" className="bg-slate-900">{t("signup.year2")}</option>
        </select>
      </div>
      <input
        className={input + " mb-3"}
        placeholder={t("tt.subject")}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <button
        onClick={startSession}
        disabled={busy}
        className="mb-5 w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold hover:bg-violet-500 disabled:opacity-60"
      >
        {busy ? t("att.starting") : t("att.start")}
      </button>
      {err && <p className="mb-4 text-sm text-red-300">{err}</p>}

      {/* active session panel */}
      {active && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">
                {active.subject || `${active.department}`}
              </div>
              <div className="text-xs text-slate-400">
                {active.department} · {t("common.year")} {active.year} ·{" "}
                {new Date(active.session_date).toLocaleDateString()}
              </div>
            </div>
            <span
              className={
                "rounded-full px-3 py-1 text-xs font-semibold " +
                (active.status === "open"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-slate-500/20 text-slate-300")
              }
            >
              {active.status === "open" ? t("att.open") : t("att.closed")}
            </span>
          </div>

          {active.status === "open" && qr && (
            <div className="mb-4 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt="QR"
                className="rounded-2xl border-4 border-white"
                width={240}
                height={240}
              />
              <p className="mt-3 text-center text-xs text-slate-400">{t("att.scanHint")}</p>
              <p className="mt-1 break-all text-center text-[11px] text-slate-500">{url}</p>
            </div>
          )}

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {t("att.checkedInCount")}: {checkins.length}
            </span>
            {active.status === "open" && (
              <button
                onClick={closeSession}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                {t("att.close")}
              </button>
            )}
          </div>

          {checkins.length === 0 ? (
            <p className="text-sm text-slate-500">{t("att.none")}</p>
          ) : (
            <div className="space-y-1.5">
              {checkins.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <span className="w-5 text-xs text-slate-500">{i + 1}</span>
                  <span className="flex-1 text-sm">
                    {c.student?.full_name || "—"}
                  </span>
                  <span className="text-xs text-emerald-300">✓</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* recent sessions for this class */}
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
        {t("att.recent")}
      </h2>
      {classSessions.length === 0 ? (
        <p className="text-sm text-slate-500">{t("att.noSessions")}</p>
      ) : (
        <div className="space-y-2">
          {classSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className={
                "flex w-full items-center justify-between gap-3 rounded-xl border bg-white/5 p-3 text-left transition hover:bg-white/10 " +
                (active?.id === s.id ? "border-violet-400" : "border-white/10")
              }
            >
              <div>
                <div className="text-sm font-medium">{s.subject || s.department}</div>
                <div className="text-xs text-slate-400">
                  {new Date(s.session_date).toLocaleDateString()}
                </div>
              </div>
              <span
                className={
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                  (s.status === "open"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-slate-500/20 text-slate-300")
                }
              >
                {s.status === "open" ? t("att.open") : t("att.closed")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
