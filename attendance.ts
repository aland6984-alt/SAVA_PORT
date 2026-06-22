export type AttendanceSession = {
  id: string;
  token: string;
  department: string;
  year: number;
  subject: string | null;
  session_date: string;
  status: string; // 'open' | 'closed'
  created_at: string;
};

export type Checkin = {
  id: string;
  session_id: string;
  student_id: string;
  created_at: string;
  student?: { full_name: string | null } | null;
};

export function randomToken(): string {
  return (
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 8)
  );
}
