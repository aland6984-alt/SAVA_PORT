"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/types";
import { kindIcon, type ChatGroup, type StudentLite } from "@/lib/chat";
import { useT } from "@/components/I18nProvider";

type MyGroup = ChatGroup & { myRole: string };

const input =
  "w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-violet-400";

export default function ChatHome({
  meId,
  isAdmin,
  myGroups,
  allGroups,
  students,
  counts,
}: {
  meId: string;
  isAdmin: boolean;
  myGroups: MyGroup[];
  allGroups: ChatGroup[];
  students: StudentLite[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const t = useT();

  const [groups, setGroups] = useState<ChatGroup[]>(allGroups);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("lab");
  const [dept, setDept] = useState<string>(DEPARTMENTS[0]);
  const [year, setYear] = useState("1");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function createGroup() {
    if (!name.trim()) {
      setErr(t("chat.enterName"));
      return;
    }
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_groups")
      .insert({
        name: name.trim(),
        kind,
        department: dept,
        year: Number(year),
        created_by: meId,
      })
      .select()
      .single();
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setGroups((g) => [data as ChatGroup, ...g]);
    setName("");
    setOpen(false);
  }

  async function assignLeader(groupId: string, studentId: string) {
    if (!studentId) return;
    const supabase = createClient();
    await supabase.from("chat_groups").update({ leader_id: studentId }).eq("id", groupId);
    await supabase
      .from("chat_group_members")
      .upsert(
        { group_id: groupId, user_id: studentId, role: "leader" },
        { onConflict: "group_id,user_id" }
      );
    setGroups((gs) =>
      gs.map((g) => (g.id === groupId ? { ...g, leader_id: studentId } : g))
    );
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* My groups */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          {t("chat.myGroups")}
        </h2>
        {myGroups.length === 0 ? (
          <p className="text-sm text-slate-500">{t("chat.noGroups")}</p>
        ) : (
          <div className="space-y-2">
            {myGroups.map((g) => (
              <Link
                key={g.id}
                href={`/dashboard/chat/${g.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
              >
                <span className="text-2xl leading-none">{kindIcon(g.kind)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{g.name}</div>
                  <div className="truncate text-xs text-slate-400">
                    {[g.department, g.year ? `${t("common.year")} ${g.year}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {g.myRole === "leader" && (
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                    👑 {t("chat.roleLeader")}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Admin: manage groups */}
      {isAdmin && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            {t("chat.manage")}
          </h2>

          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="mb-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
            >
              + {t("chat.create")}
            </button>
          ) : (
            <div className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <input
                className={input}
                placeholder={t("chat.groupName")}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErr("");
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <select className={input} value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="lab" className="bg-slate-900">🔬 {t("chat.kindLab")}</option>
                  <option value="hall" className="bg-slate-900">🏫 {t("chat.kindHall")}</option>
                </select>
                <select className={input} value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="1" className="bg-slate-900">{t("signup.year1")}</option>
                  <option value="2" className="bg-slate-900">{t("signup.year2")}</option>
                </select>
              </div>
              <select className={input} value={dept} onChange={(e) => setDept(e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900">{d}</option>
                ))}
              </select>
              {err && <p className="text-sm text-red-300">{err}</p>}
              <div className="flex gap-2">
                <button
                  onClick={createGroup}
                  disabled={busy}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-60"
                >
                  {busy ? t("common.saving") : t("chat.create")}
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

          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">{t("chat.noGroupsAdmin")}</p>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => {
                const leader = students.find((s) => s.id === g.leader_id);
                const pool = students.filter(
                  (s) =>
                    (!g.department || s.department === g.department) &&
                    (!g.year || s.year === g.year)
                );
                return (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{kindIcon(g.kind)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{g.name}</div>
                        <div className="truncate text-xs text-slate-400">
                          {[g.department, g.year ? `${t("common.year")} ${g.year}` : null]
                            .filter(Boolean)
                            .join(" · ")}{" "}
                          · {counts[g.id] ?? 0} 👥
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-400">
                      👑 {t("chat.leader")}:{" "}
                      <span className="font-semibold text-white">
                        {leader?.full_name ?? t("chat.noLeader")}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <select
                        className={input}
                        defaultValue=""
                        onChange={(e) => {
                          assignLeader(g.id, e.target.value);
                          e.target.value = "";
                        }}
                      >
                        <option value="" className="bg-slate-900">
                          {t("chat.setLeader")}…
                        </option>
                        {pool.map((s) => (
                          <option key={s.id} value={s.id} className="bg-slate-900">
                            {s.full_name ?? "—"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
