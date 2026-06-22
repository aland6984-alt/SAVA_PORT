"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/I18nProvider";

type Opt = { id: string; text: string; position: number };

export default function PollCard({
  pollId,
  meId,
  isLeader,
}: {
  pollId: string;
  meId: string;
  isLeader: boolean;
}) {
  const t = useT();
  const [question, setQuestion] = useState("");
  const [closed, setClosed] = useState(false);
  const [options, setOptions] = useState<Opt[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: poll } = await supabase
      .from("chat_polls")
      .select("question, closed")
      .eq("id", pollId)
      .maybeSingle();
    if (poll) {
      setQuestion(poll.question as string);
      setClosed(poll.closed as boolean);
    }
    const { data: opts } = await supabase
      .from("chat_poll_options")
      .select("id, text, position")
      .eq("poll_id", pollId)
      .order("position");
    setOptions((opts as Opt[]) ?? []);
    const { data: mine } = await supabase
      .from("chat_poll_votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .eq("voter_id", meId)
      .maybeSingle();
    setMyVote((mine?.option_id as string) ?? null);
    const { data: cnts } = await supabase.rpc("poll_counts", { pid: pollId });
    const map: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cnts ?? []).forEach((r: any) => {
      map[r.opt_id] = Number(r.n);
    });
    setCounts(map);
    setLoaded(true);
  }, [pollId, meId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const showResults = myVote !== null || closed;

  async function vote(optionId: string) {
    if (closed) return;
    const supabase = createClient();
    await supabase
      .from("chat_poll_votes")
      .upsert(
        { poll_id: pollId, option_id: optionId, voter_id: meId },
        { onConflict: "poll_id,voter_id" }
      );
    setMyVote(optionId);
    load();
  }

  async function closePoll() {
    const supabase = createClient();
    await supabase.from("chat_polls").update({ closed: true }).eq("id", pollId);
    setClosed(true);
    load();
  }

  if (!loaded) {
    return (
      <div className="w-full rounded-2xl border border-violet-400/30 bg-violet-500/5 p-4 text-sm text-slate-400">
        🗳️ …
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-violet-400/30 bg-violet-500/5 p-4">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-violet-300">
        🗳️ {t("poll.title")}
        {closed ? ` · ${t("poll.closed")}` : ""}
      </div>
      <div className="mb-3 font-semibold">{question}</div>

      <div className="space-y-2">
        {options.map((o) => {
          const n = counts[o.id] ?? 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          const mineSel = myVote === o.id;
          if (showResults) {
            return (
              <div
                key={o.id}
                className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5"
              >
                <div
                  className="absolute inset-y-0 start-0 bg-violet-500/25"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                  <span className={mineSel ? "font-semibold" : ""}>
                    {mineSel ? "✓ " : ""}
                    {o.text}
                  </span>
                  <span className="font-semibold">{pct}%</span>
                </div>
              </div>
            );
          }
          return (
            <button
              key={o.id}
              onClick={() => vote(o.id)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-start text-sm hover:bg-white/10"
            >
              {o.text}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          {total} {t("poll.votes")}
        </span>
        {isLeader && !closed && (
          <button
            onClick={closePoll}
            className="rounded border border-white/15 px-2 py-1 hover:bg-white/10"
          >
            {t("poll.close")}
          </button>
        )}
      </div>
    </div>
  );
}
