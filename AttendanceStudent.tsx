"use client";

import { useT } from "@/components/I18nProvider";

type Row = {
  id: string;
  created_at: string;
  session: {
    department: string;
    year: number;
    subject: string | null;
    session_date: string;
  } | null;
};

export default function AttendanceStudent({ rows }: { rows: Row[] }) {
  const t = useT();

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-violet-100">
        📷 {t("att.studentHint")}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t("att.noCheckins")}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div>
                <div className="text-sm font-medium">
                  {r.session ? r.session.subject || r.session.department : t("att.session")}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(
                    r.session?.session_date || r.created_at
                  ).toLocaleDateString()}
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                {t("att.present")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
