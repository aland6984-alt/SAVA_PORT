import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isStaff } from "@/lib/types";
import { getT } from "@/lib/i18n-server";
import { type TimetableEntry } from "@/lib/timetable";
import TimetableView from "./TimetableView";
import TimetableManager from "./TimetableManager";

export const dynamic = "force-dynamic";

export default async function TimetablePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  const t = await getT();
  const supabase = await createClient();

  // Staff: pick any class and manage it.
  if (isStaff(profile.role)) {
    const { data } = await supabase
      .from("timetable")
      .select("*")
      .order("day_of_week")
      .order("start_time");
    return (
      <div>
        <h1 className="text-xl font-bold">{t("nav.timetable")}</h1>
        <p className="mb-5 mt-1 text-sm text-slate-400">{t("tt.subtitleStaff")}</p>
        <TimetableManager initial={(data as TimetableEntry[]) ?? []} />
      </div>
    );
  }

  // Student: read-only view of their own class.
  let entries: TimetableEntry[] = [];
  if (profile.department && profile.year) {
    const { data } = await supabase
      .from("timetable")
      .select("*")
      .eq("department", profile.department)
      .eq("year", profile.year)
      .order("day_of_week")
      .order("start_time");
    entries = (data as TimetableEntry[]) ?? [];
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t("nav.timetable")}</h1>
      <p className="mb-5 mt-1 text-sm text-slate-400">
        {profile.department
          ? `${profile.department} · ${t("common.year")} ${profile.year}`
          : t("grades.noClass")}
      </p>
      <TimetableView entries={entries} />
    </div>
  );
}
