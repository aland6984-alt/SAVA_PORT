export type Role = "super_admin" | "admin" | "teacher" | "student";

export type PhonePrivacy = "all" | "staff" | "friends" | "private";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  department: string | null;
  year: number | null;
  phone: string | null;
  blood: string | null;
  photo_url: string | null;
  phone_privacy: PhonePrivacy | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience_dept: string | null; // null = whole institute
  audience_year: number | null; // null = all years
  created_by: string | null;
  created_at: string;
  author?: { full_name: string | null } | null;
}

// Where each role lands after login.
export const roleHome: Record<Role, string> = {
  super_admin: "/dashboard/super-admin",
  admin: "/dashboard/admin",
  teacher: "/dashboard/teacher",
  student: "/dashboard/student",
};

export const roleLabel: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

export const DEPARTMENTS = [
  "Nursing",
  "Pharmacy",
  "Medical Laboratory Technology",
  "Dental Technology",
  "Aesthetic Clinic",
  "English",
  "Hospital Administration",
  "Marketing",
  "Network Services",
] as const;

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export function isStaff(role: Role): boolean {
  return role === "admin" || role === "super_admin" || role === "teacher";
}
export function isAdmin(role: Role): boolean {
  return role === "admin" || role === "super_admin";
}
