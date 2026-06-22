export type Material = {
  id: string;
  department: string;
  year: number;
  subject: string | null;
  title: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
};

// Map a filename to a friendly type label + emoji icon.
export function fileKind(name: string): { type: string; icon: string } {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return { type: "pdf", icon: "📄" };
  if (ext === "doc" || ext === "docx") return { type: "doc", icon: "📝" };
  if (ext === "ppt" || ext === "pptx") return { type: "ppt", icon: "📊" };
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return { type: "xls", icon: "📈" };
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return { type: "img", icon: "🖼️" };
  return { type: ext || "file", icon: "📎" };
}

export const MATERIAL_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg";
