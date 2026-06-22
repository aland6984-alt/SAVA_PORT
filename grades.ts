// Grade model + calculation helpers (ported from the prototype).

export const EXAM_PARTS = ["quiz", "midterm", "final", "practical"] as const;
export type ExamPart = (typeof EXAM_PARTS)[number];

export const EXAM_PART_LABEL: Record<ExamPart, string> = {
  quiz: "Quiz",
  midterm: "Midterm",
  final: "Final",
  practical: "Practical",
};

export type ExamWeights = Record<ExamPart, number>;
export const DEFAULT_WEIGHTS: ExamWeights = {
  quiz: 10,
  midterm: 25,
  final: 40,
  practical: 25,
};

export interface Subject {
  id: string;
  name: string;
  department: string;
  year: number;
  exam_weights: ExamWeights;
  created_at?: string;
}

export interface Grade {
  id?: string;
  subject_id: string;
  student_id: string;
  quiz: number | null;
  midterm: number | null;
  final: number | null;
  practical: number | null;
  updated_at?: string;
}

export const PASS_MARK = 50;

export function normalizeWeights(w: Partial<ExamWeights> | null | undefined): ExamWeights {
  if (!w) return { ...DEFAULT_WEIGHTS };
  return {
    quiz: Number(w.quiz ?? 0),
    midterm: Number(w.midterm ?? 0),
    final: Number(w.final ?? 0),
    practical: Number(w.practical ?? 0),
  };
}

// Weighted final %, normalized over the parts that actually have a score.
export function computeFinal(grade: Partial<Grade>, weights: ExamWeights): number | null {
  let sum = 0;
  let totalW = 0;
  let any = false;
  for (const part of EXAM_PARTS) {
    const v = grade[part];
    if (v !== null && v !== undefined && !Number.isNaN(Number(v))) {
      const w = weights[part] ?? 0;
      sum += Number(v) * w;
      totalW += w;
      any = true;
    }
  }
  if (!any || totalW === 0) return null;
  return Math.round((sum / totalW) * 10) / 10;
}

export function letterGrade(pct: number): string {
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  if (pct >= PASS_MARK) return "E";
  return "F";
}

export function gradePoint(pct: number): number {
  if (pct >= 90) return 4;
  if (pct >= 80) return 3;
  if (pct >= 70) return 2;
  if (pct >= 60) return 1;
  if (pct >= PASS_MARK) return 0.5;
  return 0;
}

export function isPass(pct: number): boolean {
  return pct >= PASS_MARK;
}

export function statusColor(pct: number): string {
  return isPass(pct) ? "text-emerald-300" : "text-red-300";
}

export interface GpaResult {
  gpa: number;
  avg: number;
  passed: number;
  total: number;
}

export function computeGpa(finals: (number | null)[]): GpaResult {
  const vals = finals.filter((f): f is number => f !== null);
  if (vals.length === 0) return { gpa: 0, avg: 0, passed: 0, total: 0 };
  const gpa = vals.reduce((s, v) => s + gradePoint(v), 0) / vals.length;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  const passed = vals.filter((v) => isPass(v)).length;
  return {
    gpa: Math.round(gpa * 100) / 100,
    avg: Math.round(avg * 10) / 10,
    passed,
    total: vals.length,
  };
}
