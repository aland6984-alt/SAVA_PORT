export type TimetableEntry = {
  id: string;
  department: string;
  year: number;
  day_of_week: number; // 0 = Saturday ... 6 = Friday
  start_time: string; // "08:00"
  end_time: string; // "09:30"
  subject: string;
  teacher: string | null;
  room: string | null;
};

// Ordered Saturday → Friday (common school-week order in Kurdistan).
// Empty days are simply skipped when displaying.
export const DAYS: { n: number; key: string }[] = [
  { n: 0, key: "day.sat" },
  { n: 1, key: "day.sun" },
  { n: 2, key: "day.mon" },
  { n: 3, key: "day.tue" },
  { n: 4, key: "day.wed" },
  { n: 5, key: "day.thu" },
  { n: 6, key: "day.fri" },
];
