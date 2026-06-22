"use client";

import { fileKind, type Material } from "@/lib/materials";
import { useT } from "@/components/I18nProvider";

export default function MaterialsView({ materials }: { materials: Material[] }) {
  const t = useT();

  if (materials.length === 0) {
    return <p className="text-sm text-slate-500">{t("mat.empty")}</p>;
  }

  return (
    <div className="space-y-2">
      {materials.map((m) => {
        const k = fileKind(m.file_name);
        return (
          <a
            key={m.id}
            href={m.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
          >
            <span className="text-2xl leading-none">{k.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{m.title}</div>
              <div className="truncate text-xs text-slate-400">
                {[m.subject, new Date(m.created_at).toLocaleDateString()]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-violet-300">
              {t("mat.open")} →
            </span>
          </a>
        );
      })}
    </div>
  );
}
