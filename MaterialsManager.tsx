"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/types";
import { fileKind, MATERIAL_ACCEPT, type Material } from "@/lib/materials";
import { useT } from "@/components/I18nProvider";

const input =
  "w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-violet-400";

export default function MaterialsManager({
  initial,
  lockedDept,
}: {
  initial: Material[];
  lockedDept: string | null;
}) {
  const router = useRouter();
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Material[]>(initial);
  const [dept, setDept] = useState<string>(lockedDept ?? DEPARTMENTS[0]);
  const [year, setYear] = useState("1");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const classItems = items.filter(
    (m) => m.department === dept && m.year === Number(year)
  );

  async function upload() {
    if (!file) {
      setErr(t("mat.pickFile"));
      return;
    }
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${dept}/${year}/${Date.now()}-${safe}`;

    const { error: upErr } = await supabase.storage
      .from("materials")
      .upload(path, file, { upsert: false });
    if (upErr) {
      setErr(upErr.message);
      setBusy(false);
      return;
    }

    const { data: pub } = supabase.storage.from("materials").getPublicUrl(path);
    const k = fileKind(file.name);

    const { data, error } = await supabase
      .from("materials")
      .insert({
        department: dept,
        year: Number(year),
        subject: subject.trim() || null,
        title: title.trim() || file.name,
        file_name: file.name,
        file_path: path,
        file_url: pub.publicUrl,
        file_type: k.type,
        uploaded_by: user?.id ?? null,
      })
      .select()
      .single();

    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setItems((s) => [data as Material, ...s]);
    setTitle("");
    setSubject("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function remove(m: Material) {
    const supabase = createClient();
    await supabase.storage.from("materials").remove([m.file_path]);
    const { error } = await supabase.from("materials").delete().eq("id", m.id);
    if (!error) setItems((s) => s.filter((x) => x.id !== m.id));
  }

  return (
    <div>
      {/* class picker */}
      <div className="mb-4 grid grid-cols-2 gap-3">
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

      {/* upload form */}
      <div className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <input
          className={input}
          placeholder={t("mat.title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={input}
          placeholder={t("tt.subject")}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <input
          ref={fileRef}
          type="file"
          accept={MATERIAL_ACCEPT}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setErr("");
          }}
          className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-violet-500"
        />
        {err && <p className="text-sm text-red-300">{err}</p>}
        <button
          onClick={upload}
          disabled={busy}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-60"
        >
          {busy ? t("mat.uploading") : t("mat.uploadBtn")}
        </button>
      </div>

      {/* uploaded files for the selected class */}
      {classItems.length === 0 ? (
        <p className="text-sm text-slate-500">{t("mat.empty")}</p>
      ) : (
        <div className="space-y-2">
          {classItems.map((m) => {
            const k = fileKind(m.file_name);
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <span className="text-2xl leading-none">{k.icon}</span>
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1"
                >
                  <div className="truncate font-medium">{m.title}</div>
                  <div className="truncate text-xs text-slate-400">
                    {[m.subject, new Date(m.created_at).toLocaleDateString()]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </a>
                <button
                  onClick={() => remove(m)}
                  title={t("common.delete")}
                  className="rounded-md border border-white/15 px-2 py-1.5 text-xs text-slate-400 hover:bg-white/10 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
