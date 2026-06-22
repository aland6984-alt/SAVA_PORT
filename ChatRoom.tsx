"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  kindIcon,
  type ChatGroup,
  type ChatMessage,
  type GroupMember,
  type StudentLite,
} from "@/lib/chat";
import { useT } from "@/components/I18nProvider";
import PollCard from "./PollCard";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export default function ChatRoom({
  group,
  meId,
  isLeader,
  isAdmin,
  initialMessages,
  initialMembers,
  deptStudents,
}: {
  group: ChatGroup;
  meId: string;
  isLeader: boolean;
  isAdmin: boolean;
  initialMessages: ChatMessage[];
  initialMembers: GroupMember[];
  deptStudents: StudentLite[];
}) {
  const t = useT();
  const canManage = isLeader || isAdmin;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [members, setMembers] = useState<GroupMember[]>(initialMembers);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [err, setErr] = useState("");
  const [showPoll, setShowPoll] = useState(false);
  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState<string[]>(["", ""]);
  const [pollErr, setPollErr] = useState("");

  const endRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recStartRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchMessages = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("chat_messages")
      .select("*, sender:sender_id(full_name)")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true })
      .limit(300);
    if (data) setMessages(data as ChatMessage[]);
  }, [group.id]);

  useEffect(() => {
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("chat_messages")
      .insert({ group_id: group.id, sender_id: meId, body, kind: "text" });
    setSending(false);
    if (!error) {
      setText("");
      fetchMessages();
    }
  }

  async function uploadToChat(
    file: File
  ): Promise<{ path: string; url: string } | null> {
    const supabase = createClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${group.id}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage
      .from("chat-media")
      .upload(path, file, { upsert: false });
    if (error) {
      setErr(error.message);
      return null;
    }
    const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  async function sendMedia(kind: string, file: File, duration?: number) {
    setUploading(true);
    setErr("");
    const up = await uploadToChat(file);
    if (!up) {
      setUploading(false);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("chat_messages").insert({
      group_id: group.id,
      sender_id: meId,
      body: null,
      kind,
      file_url: up.url,
      file_name: file.name,
      file_path: up.path,
      duration: duration ?? null,
    });
    setUploading(false);
    if (!error) fetchMessages();
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!f) return;
    const kind = f.type.startsWith("image/") ? "image" : "file";
    sendMedia(kind, f);
  }

  async function startRecording() {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        streamRef.current?.getTracks().forEach((tk) => tk.stop());
        const ext = type.includes("mp4")
          ? "m4a"
          : type.includes("webm")
            ? "webm"
            : type.includes("ogg")
              ? "ogg"
              : "dat";
        const dur = Math.max(1, Math.round((Date.now() - recStartRef.current) / 1000));
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type });
        await sendMedia("voice", file, dur);
      };
      mrRef.current = mr;
      mr.start();
      recStartRef.current = Date.now();
      setRecording(true);
      setRecSec(0);
      recTimerRef.current = setInterval(() => setRecSec((s) => s + 1), 1000);
    } catch {
      setErr(t("chat.micDenied"));
    }
  }

  function stopRecording() {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecording(false);
    mrRef.current?.stop();
  }

  function cancelRecording() {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecording(false);
    const mr = mrRef.current;
    if (mr) {
      mr.onstop = null;
      try {
        mr.stop();
      } catch {
        /* ignore */
      }
    }
    streamRef.current?.getTracks().forEach((tk) => tk.stop());
    chunksRef.current = [];
  }

  async function addStudent(s: StudentLite) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_group_members")
      .insert({ group_id: group.id, user_id: s.id, role: "member" })
      .select("*, user:user_id(full_name, department, year)")
      .single();
    if (!error && data) setMembers((m) => [...m, data as GroupMember]);
  }

  async function removeMember(m: GroupMember) {
    const supabase = createClient();
    const { error } = await supabase
      .from("chat_group_members")
      .delete()
      .eq("id", m.id);
    if (!error) setMembers((list) => list.filter((x) => x.id !== m.id));
  }

  const memberIds = new Set(members.map((m) => m.user_id));
  const addable = deptStudents.filter((s) => !memberIds.has(s.id));

  async function createPoll() {
    const q = pollQ.trim();
    const opts = pollOpts.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) {
      setPollErr(t("poll.need"));
      return;
    }
    const supabase = createClient();
    const { data: poll, error } = await supabase
      .from("chat_polls")
      .insert({ group_id: group.id, created_by: meId, question: q })
      .select()
      .single();
    if (error || !poll) {
      setPollErr(error?.message || "");
      return;
    }
    await supabase
      .from("chat_poll_options")
      .insert(opts.map((text, i) => ({ poll_id: poll.id, text, position: i })));
    await supabase.from("chat_messages").insert({
      group_id: group.id,
      sender_id: meId,
      kind: "poll",
      poll_id: poll.id,
      body: null,
    });
    setShowPoll(false);
    setPollQ("");
    setPollOpts(["", ""]);
    setPollErr("");
    fetchMessages();
  }

  function renderBody(m: ChatMessage) {
    if (m.kind === "image" && m.file_url) {
      return (
        <a href={m.file_url} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.file_url} alt="" className="max-h-64 max-w-full rounded-lg" />
        </a>
      );
    }
    if (m.kind === "voice" && m.file_url) {
      return (
        <div className="flex items-center gap-2">
          <audio controls src={m.file_url} className="h-9 max-w-[210px]" />
          {m.duration ? (
            <span className="text-[11px] opacity-70">{fmt(m.duration)}</span>
          ) : null}
        </div>
      );
    }
    if (m.kind === "file" && m.file_url) {
      return (
        <a
          href={m.file_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 underline"
        >
          📎 <span className="max-w-[200px] truncate">{m.file_name ?? t("chat.download")}</span>
        </a>
      );
    }
    return <div className="whitespace-pre-wrap break-words">{m.body}</div>;
  }

  const iconBtn =
    "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-lg hover:bg-white/10 disabled:opacity-50";

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      {/* header */}
      <div className="mb-3 flex items-center gap-3">
        <Link href="/dashboard/chat" className="text-sm text-slate-400 hover:text-white">
          ←
        </Link>
        <span className="text-xl">{kindIcon(group.kind)}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{group.name}</div>
          <div className="truncate text-xs text-slate-400">{members.length} 👥</div>
        </div>
        {isLeader && (
          <button
            onClick={() => {
              setShowPoll((s) => !s);
              setShowMembers(false);
            }}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            🗳️ {t("poll.new")}
          </button>
        )}
        {canManage && (
          <button
            onClick={() => setShowMembers((s) => !s)}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            {t("chat.members")}
          </button>
        )}
      </div>

      {/* members panel */}
      {canManage && showMembers && (
        <div className="mb-3 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("chat.members")} ({members.length})
          </div>
          <div className="space-y-1.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">
                  {m.user?.full_name ?? "—"}
                  {m.role === "leader" && (
                    <span className="ml-2 text-[11px] text-amber-300">
                      👑 {t("chat.roleLeader")}
                    </span>
                  )}
                </span>
                {m.role !== "leader" && (
                  <button
                    onClick={() => removeMember(m)}
                    title={t("common.delete")}
                    className="rounded px-2 py-1 text-xs text-slate-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {addable.length > 0 && (
            <>
              <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t("chat.addStudents")}
              </div>
              <div className="space-y-1.5">
                {addable.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{s.full_name ?? "—"}</span>
                    <button
                      onClick={() => addStudent(s)}
                      className="rounded-lg bg-violet-600/80 px-3 py-1 text-xs font-semibold hover:bg-violet-500"
                    >
                      {t("chat.add")}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* poll creation (leader) */}
      {isLeader && showPoll && (
        <div className="mb-3 space-y-2 rounded-2xl border border-violet-400/30 bg-violet-500/5 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-violet-300">
            🗳️ {t("poll.new")}
          </div>
          <input
            className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
            placeholder={t("poll.question")}
            value={pollQ}
            onChange={(e) => {
              setPollQ(e.target.value);
              setPollErr("");
            }}
          />
          {pollOpts.map((o, i) => (
            <input
              key={i}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
              placeholder={`${t("poll.optionPh")} ${i + 1}`}
              value={o}
              onChange={(e) => {
                const next = [...pollOpts];
                next[i] = e.target.value;
                setPollOpts(next);
              }}
            />
          ))}
          {pollOpts.length < 5 && (
            <button
              onClick={() => setPollOpts((p) => [...p, ""])}
              className="text-xs text-violet-300 hover:text-violet-200"
            >
              {t("poll.addOption")}
            </button>
          )}
          {pollErr && <p className="text-sm text-red-300">{pollErr}</p>}
          <div className="flex gap-2">
            <button
              onClick={createPoll}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
            >
              {t("poll.post")}
            </button>
            <button
              onClick={() => {
                setShowPoll(false);
                setPollErr("");
              }}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* messages */}
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">{t("chat.noMessages")}</p>
        ) : (
          messages.map((m) => {
            if (m.kind === "poll" && m.poll_id) {
              return (
                <div key={m.id} className="flex justify-center">
                  <div className="w-full max-w-[94%]">
                    <PollCard pollId={m.poll_id} meId={meId} isLeader={isLeader} />
                  </div>
                </div>
              );
            }
            const mine = m.sender_id === meId;
            return (
              <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                <div
                  className={
                    "max-w-[82%] rounded-2xl px-3 py-2 text-sm " +
                    (mine
                      ? "bg-violet-600 text-white"
                      : "border border-white/10 bg-white/10 text-slate-100")
                  }
                >
                  {!mine && (
                    <div className="mb-0.5 text-[11px] font-semibold text-violet-300">
                      {m.sender?.full_name ?? "—"}
                    </div>
                  )}
                  {renderBody(m)}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="mt-3">
        {err && <p className="mb-2 text-xs text-red-300">{err}</p>}
        {recording ? (
          <div className="flex items-center gap-3 rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="flex-1 text-sm text-red-200">
              {t("chat.recording")} {fmt(recSec)}
            </span>
            <button onClick={cancelRecording} className="text-xs text-slate-300">
              {t("common.cancel")}
            </button>
            <button
              onClick={stopRecording}
              className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold hover:bg-violet-500"
            >
              {t("chat.send")}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              className="hidden"
              onChange={onPickFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title={t("chat.attach")}
              className={iconBtn}
            >
              📎
            </button>
            <button
              onClick={startRecording}
              disabled={uploading}
              title={t("chat.voiceMsg")}
              className={iconBtn}
            >
              🎤
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder={uploading ? t("chat.sending") : t("chat.messagePh")}
              disabled={uploading}
              className="flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400 disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={sending || uploading || !text.trim()}
              className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
            >
              {t("chat.send")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
