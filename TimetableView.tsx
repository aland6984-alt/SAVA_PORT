"use client";

import { DAYS, type TimetableEntry } from "@/lib/timetable";
import { useT } from "@/components/I18nProvider";

export default function TimetableView({ entries }: { entries: TimetableEntry[] }) {
  const t = useT();

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">{t("tt.empty")}</p>;
  }

  const daysWithClasses = DAYS.filter((d) =>
    entries.some((e) => e.day_of_week === d.n)
  );

  return (
    <div className="space-y-5">
      {daysWithClasses.map((d) => {
        const dayEntries = entries
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
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
