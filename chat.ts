export type ChatGroup = {
  id: string;
  name: string;
  kind: string; // 'hall' | 'lab'
  department: string | null;
  year: number | null;
  leader_id: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  group_id: string;
  sender_id: string | null;
  body: string | null;
  kind: string; // 'text' | 'image' | 'file' | 'voice'
  file_url: string | null;
  file_name: string | null;
  duration: number | null;
  poll_id: string | null;
  created_at: string;
  sender?: { full_name: string | null } | null;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  user?: {
    full_name: string | null;
    department: string | null;
    year: number | null;
  } | null;
};

export type StudentLite = {
  id: string;
  full_name: string | null;
  department: string | null;
  year: number | null;
};

export function kindIcon(kind: string): string {
  return kind === "hall" ? "🏫" : "🔬";
}
