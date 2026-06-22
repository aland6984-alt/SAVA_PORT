"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/types";
import AuthBackground from "@/components/AuthBackground";
import { useI18n } from "@/components/I18nProvider";

const input =
  "w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-white placeholder-slate-300 outline-none focus:border-violet-400";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [year, setYear] = useState("1");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          department,
          year: role === "student" ? year : "",
        },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // If email confirmation is ON, there is no session yet.
    if (!data.session) {
      setInfo(t("signup.confirmEmail"));
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <AuthBackground />
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sava-logo.jpg"
                alt="SAVA"
                className="h-16 w-16 rounded-2xl shadow-lg ring-1 ring-white/20"
              />
              <h1 className="mt-3 text-xl font-bold">{t("signup.title")}</h1>
              <p className="mt-1 text-sm text-slate-300">{t("signup.subtitle")}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`rounded-lg border py-2 text-sm font-semibold ${
                    role === "student"
                      ? "border-violet-400 bg-violet-600/40"
                      : "border-white/15 bg-white/10"
                  }`}
                >
                  {t("signup.student")}
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`rounded-lg border py-2 text-sm font-semibold ${
                    role === "teacher"
                      ? "border-violet-400 bg-violet-600/40"
                      : "border-white/15 bg-white/10"
                  }`}
                >
                  {t("signup.teacher")}
                </button>
              </div>

              <input
                required
                placeholder={t("signup.fullName")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={input}
              />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={input}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900">
                    {d}
                  </option>
                ))}
              </select>
              {role === "student" && (
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={input}
                >
                  <option value="1" className="bg-slate-900">{t("signup.year1")}</option>
                  <option value="2" className="bg-slate-900">{t("signup.year2")}</option>
                </select>
              )}
              <input
                type="email"
                required
                placeholder={t("login.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
              />
              <input
                type="password"
                required
                placeholder={t("signup.passwordHint")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
              {info && (
                <p className="rounded-lg bg-emerald-500/15 p-2 text-sm text-emerald-200">
                  {info}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-violet-600 py-2.5 font-semibold shadow-lg shadow-violet-900/40 hover:bg-violet-500 disabled:opacity-60"
              >
                {loading ? t("signup.creating") : t("signup.create")}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-300">
              {t("signup.haveAccount")}{" "}
              <Link href="/login" className="font-semibold text-violet-300">{t("login.signIn")}</Link>
            </p>
          </div>
          <p className="mt-5 text-center text-[11px] uppercase tracking-widest text-slate-400">
            {t("credit.designedBy")}{" "}
            <span className="font-semibold text-slate-300">Aland Hiwa</span>
          </p>
        </div>
      </main>
    </>
  );
}
